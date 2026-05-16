import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { getModel } from "@/services/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getConversation,
  countConversationMessages,
  getLastMessageTime,
  updateRelationshipStage,
} from "@/db/queries";
import {
  evaluateRelationshipStage,
  generateEmotionalState,
  buildSystemPrompt,
  type RelationshipStage,
} from "@/services/ai/personality";
import {
  retrieveRelevantMemories,
  formatMemoriesForPrompt,
  extractMemories,
  storeMemories,
} from "@/services/memory";
import { generateAvailabilityState } from "@/services/scarcity";
import { checkMessageGating, incrementDailyUsage } from "@/services/billing";
import {
  fetchEmotionalProfile,
  computeAdaptiveModifiers,
  getAdaptationPromptBlock,
  detectAttachmentSignals,
  computeEmotionalDepth,
  computeAverageMessageLength,
  evolveProfile,
  evaluateAndUpdateChurnRisk,
} from "@/services/adaptation";
import {
  trackAvailabilityStateChanged,
  trackDelayedResponseTriggered,
  trackProfileUpdated,
  trackAdaptationApplied,
  trackChurnRiskPredicted,
} from "@/lib/posthog/events";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const gating = await checkMessageGating(session.user.id);
  if (!gating.allowed) {
    return Response.json(
      {
        error: "daily_limit_reached",
        usage: gating.usage,
        tier: gating.tier,
      },
      { status: 429 }
    );
  }

  const messageCount = await countConversationMessages(conversationId);

  const daysActive = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(conversation.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const currentStage = (conversation.relationshipStage ??
    "curiosity") as RelationshipStage;

  const stageResult = evaluateRelationshipStage({
    messageCount,
    daysActive,
    currentStage,
  });

  if (stageResult.advanced) {
    await updateRelationshipStage(conversationId, stageResult.stage);
  }

  const lastMessageDate = await getLastMessageTime(conversationId);
  const hoursSinceLastMessage = lastMessageDate
    ? (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60)
    : null;

  const emotionalResult = generateEmotionalState({
    relationshipStage: stageResult.stage,
    messageCount,
    hoursSinceLastMessage,
    daysActive,
  });

  // Retrieve emotionally relevant memories for prompt injection
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();
  const lastUserText = lastUserMessage?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";

  let memoriesBlock = "";
  if (lastUserText && process.env.OPENAI_API_KEY) {
    try {
      const relevantMemories = await retrieveRelevantMemories(
        session.user.id,
        lastUserText,
        gating.entitlements.maxMemoriesPerPrompt
      );
      memoriesBlock = formatMemoriesForPrompt(relevantMemories);
    } catch {
      // Memory retrieval failure is non-fatal
    }
  }

  // Fetch user emotional profile for adaptive personalization
  let adaptationBlock: string | undefined;
  let profileData: Awaited<ReturnType<typeof fetchEmotionalProfile>> | null = null;
  try {
    profileData = await fetchEmotionalProfile(session.user.id);
    const modifiers = computeAdaptiveModifiers(profileData, stageResult.stage);
    const block = getAdaptationPromptBlock(modifiers, profileData);
    if (block) {
      adaptationBlock = block;
      const activeModifiers = block.split("\n").length - 1;
      trackAdaptationApplied(activeModifiers, stageResult.stage);
    }
  } catch {
    // Adaptation failure is non-fatal
  }

  const currentHour = new Date().getUTCHours();
  const sessionMessageCount = messages.filter((m) => m.role === "user").length;

  let availabilityState: string = "attentive";
  let pacingDelayMs = 0;
  let scarcityBlock: string | undefined;
  try {
    const scarcityResult = generateAvailabilityState({
      relationshipStage: stageResult.stage,
      emotionalState: emotionalResult.state,
      messageCount,
      hoursSinceLastMessage,
      daysActive,
      currentHour,
      sessionMessageCount,
    });
    availabilityState = scarcityResult.state;
    pacingDelayMs = scarcityResult.pacingDelayMs;
    scarcityBlock = scarcityResult.promptBlock || undefined;

    if (scarcityResult.state !== "attentive") {
      trackAvailabilityStateChanged(
        null,
        scarcityResult.state,
        scarcityResult.metadata.reason,
        stageResult.stage
      );
    }
    if (pacingDelayMs > 0) {
      trackDelayedResponseTriggered(
        scarcityResult.state,
        pacingDelayMs,
        pacingDelayMs < 2000 ? "natural" : pacingDelayMs < 5000 ? "deliberate" : "slow"
      );
    }
  } catch {
    // Scarcity evaluation failure is non-fatal
  }

  const systemPrompt = buildSystemPrompt({
    relationshipStage: stageResult.stage,
    emotionalState: emotionalResult.state,
    emotionalIntensity: emotionalResult.intensity,
    memoriesBlock: memoriesBlock || undefined,
    scarcityBlock,
    adaptationBlock,
    isPremium: gating.tier === "premium",
  });

  const contextMessages = messages.slice(-gating.entitlements.maxContextMessages);
  const modelMessages = await convertToModelMessages(contextMessages);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async () => {
      incrementDailyUsage(session.user.id).catch(() => {});

      const recentMessages = messages.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content:
          m.parts
            ?.filter(
              (p): p is { type: "text"; text: string } => p.type === "text"
            )
            .map((p) => p.text)
            .join("") ?? "",
      }));

      // Fire-and-forget: extract emotional memories from conversation
      if (process.env.OPENAI_API_KEY) {
        try {
          const { memories: extracted } = await extractMemories(
            recentMessages,
            stageResult.stage
          );

          if (extracted.length > 0) {
            await storeMemories(session.user.id, conversationId, extracted);
          }
        } catch {
          // Extraction failure is non-fatal
        }
      }

      // Fire-and-forget: evolve emotional profile based on interaction
      try {
        const attachmentSignals = detectAttachmentSignals(recentMessages);
        const emotionalDepth = computeEmotionalDepth(recentMessages);
        const averageMessageLength = computeAverageMessageLength(recentMessages);

        const updatedProfile = await evolveProfile(session.user.id, {
          attachmentSignals,
          emotionalDepth,
          averageMessageLength,
          ritualParticipation: false,
          sessionGapHours: hoursSinceLastMessage,
        });

        trackProfileUpdated(
          updatedProfile.attachmentStyle,
          updatedProfile.churnRisk,
          attachmentSignals.length
        );

        // Evaluate churn risk with available engagement metrics
        const churnResult = await evaluateAndUpdateChurnRisk(session.user.id, {
          sessionFrequencyTrend: 0,
          emotionalDepthTrend: 0,
          ritualParticipationRate: 0.5,
          averageReplyLength: averageMessageLength,
          averageResponseGapHours: hoursSinceLastMessage ?? 0,
          emotionalReciprocity: emotionalDepth,
          messageCount,
          daysActive,
        });

        trackChurnRiskPredicted(
          churnResult.risk,
          churnResult.score,
          churnResult.signals
        );
      } catch {
        // Profile evolution failure is non-fatal
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-emotional-state": emotionalResult.state,
      "x-relationship-stage": stageResult.stage,
      "x-stage-advanced": stageResult.advanced ? "true" : "false",
      "x-availability-state": availabilityState,
      "x-pacing-delay": String(pacingDelayMs),
    },
  });
}
