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
  getCachedState,
  setCachedState,
  getConversationSummary,
  upsertConversationSummary,
} from "@/db/queries";
import {
  evaluateRelationshipStage,
  generateEmotionalState,
  buildSystemPrompt,
  type RelationshipStage,
  type EmotionalState,
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
  trackExperimentExposure,
  trackExperimentVariantApplied,
  trackModelRouted,
  trackContextCompressed,
  trackInferenceCostTracked,
} from "@/lib/posthog/events";
import {
  resolveAllActiveVariants,
  buildExperimentPromptBlock,
  type AssignmentResult,
} from "@/services/experiments";
import {
  computeTokenBudget,
  classifyRoutingDecision,
  getRoutedModel,
  detectNsfwIndicators,
  compressContext,
  shouldGenerateRollingSummary,
  generateSummary,
  estimateTokens,
  trackInferenceCost,
  estimateCost,
} from "@/services/optimization";

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

  // Check for cached emotional state to skip expensive recomputation
  const cachedState = await getCachedState(conversationId).catch(() => null);

  let stageResult: { stage: RelationshipStage; advanced: boolean };
  let emotionalResult: { state: EmotionalState; intensity: "low" | "medium" | "high" };
  let hoursSinceLastMessage: number | null = null;
  let availabilityState: string = "attentive";
  let pacingDelayMs = 0;
  let scarcityBlock: string | undefined;
  let adaptationBlock: string | undefined;

  if (cachedState) {
    // Use cached state — skip recomputation
    stageResult = {
      stage: cachedState.relationshipStage as RelationshipStage,
      advanced: false,
    };
    emotionalResult = {
      state: cachedState.emotionalState as EmotionalState,
      intensity: cachedState.emotionalIntensity as "low" | "medium" | "high",
    };
    availabilityState = cachedState.availabilityState;
    scarcityBlock = cachedState.scarcityBlock ?? undefined;
    adaptationBlock = cachedState.adaptationBlock ?? undefined;
  } else {
    // Fresh computation
    stageResult = evaluateRelationshipStage({
      messageCount,
      daysActive,
      currentStage,
    });

    if (stageResult.advanced) {
      await updateRelationshipStage(conversationId, stageResult.stage);
    }

    const lastMessageDate = await getLastMessageTime(conversationId);
    hoursSinceLastMessage = lastMessageDate
      ? (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60)
      : null;

    emotionalResult = generateEmotionalState({
      relationshipStage: stageResult.stage,
      messageCount,
      hoursSinceLastMessage,
      daysActive,
    });

    // Fetch adaptation profile
    try {
      const profileData = await fetchEmotionalProfile(session.user.id);
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
  }

  // Retrieve emotionally relevant memories for prompt injection
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();
  const lastUserText = lastUserMessage?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";

  let memoriesBlock = "";
  let memoryCount = 0;
  if (lastUserText && process.env.OPENAI_API_KEY) {
    try {
      const relevantMemories = await retrieveRelevantMemories(
        session.user.id,
        lastUserText,
        gating.entitlements.maxMemoriesPerPrompt
      );
      memoriesBlock = formatMemoriesForPrompt(relevantMemories);
      memoryCount = relevantMemories.length;
    } catch {
      // Memory retrieval failure is non-fatal
    }
  }

  let experimentBlock: string | undefined;
  let experimentAssignments: AssignmentResult[] = [];
  try {
    experimentAssignments = await resolveAllActiveVariants(session.user.id);
    if (experimentAssignments.length > 0) {
      experimentBlock = buildExperimentPromptBlock(experimentAssignments);
      for (const assignment of experimentAssignments) {
        trackExperimentExposure(
          assignment.experimentKey,
          assignment.variantName,
          assignment.isControl,
          assignment.config.dimension
        );
      }
      trackExperimentVariantApplied(
        experimentAssignments.length,
        experimentAssignments.map((a) => a.config.dimension)
      );
    }
  } catch {
    // Experiment resolution failure is non-fatal
  }

  // Compute token budget based on tier
  const tokenBudget = computeTokenBudget({
    tier: gating.tier as "free" | "premium",
    maxContextMessages: gating.entitlements.maxContextMessages,
  });

  // Model routing — classify exchange complexity
  const routingResult = classifyRoutingDecision({
    emotionalIntensity: emotionalResult.intensity,
    relationshipStage: stageResult.stage,
    messageLength: lastUserText.length,
    hasNsfwIndicators: detectNsfwIndicators(lastUserText),
    memoryComplexity: memoryCount,
    isPremium: gating.tier === "premium",
  });

  trackModelRouted(
    routingResult.decision,
    routingResult.model,
    routingResult.reason,
    stageResult.stage
  );

  const systemPrompt = buildSystemPrompt({
    relationshipStage: stageResult.stage,
    emotionalState: emotionalResult.state,
    emotionalIntensity: emotionalResult.intensity,
    memoriesBlock: memoriesBlock || undefined,
    scarcityBlock,
    adaptationBlock,
    experimentBlock,
    isPremium: gating.tier === "premium",
  });

  // Context compression — replace naive message slicing with budget-aware compression
  const plainMessages = messages.map((m) => ({
    role: m.role,
    content:
      m.parts
        ?.filter(
          (p): p is { type: "text"; text: string } => p.type === "text"
        )
        .map((p) => p.text)
        .join("") ?? "",
  }));

  const rollingSummary = await getConversationSummary(
    conversationId,
    "rolling"
  ).catch(() => null);

  const systemPromptTokens = estimateTokens(systemPrompt);
  const memoryTokens = estimateTokens(memoriesBlock);
  const availableForContext = Math.max(
    0,
    tokenBudget.contextMessagesBudget -
      Math.max(0, systemPromptTokens - tokenBudget.systemPromptBudget) -
      Math.max(0, memoryTokens - tokenBudget.memoriesBudget)
  );

  const compression = compressContext({
    messages: plainMessages,
    tokenBudget: availableForContext,
    maxMessages: gating.entitlements.maxContextMessages,
    existingSummary: rollingSummary?.content,
  });

  if (compression.compressionApplied) {
    trackContextCompressed(
      compression.tokensBefore,
      compression.tokensAfter,
      compression.tokensBefore > 0
        ? compression.tokensAfter / compression.tokensBefore
        : 1,
      !!rollingSummary
    );
  }

  // Convert compressed messages for the model
  const compressedUIMessages: UIMessage[] = compression.messages.map(
    (m, i) => ({
      id: `compressed-${i}`,
      role: m.role as UIMessage["role"],
      parts: [{ type: "text" as const, text: m.content }],
      content: m.content,
    })
  );

  const modelMessages = await convertToModelMessages(compressedUIMessages);

  // Use routed model instead of default
  let selectedModel;
  try {
    selectedModel = getRoutedModel(routingResult);
  } catch {
    // Fall back to default model if routing fails
    selectedModel = getModel();
  }

  const result = streamText({
    model: selectedModel,
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ usage }) => {
      incrementDailyUsage(session.user.id).catch(() => {});

      // Track inference cost
      try {
        const inputTokens = usage?.inputTokens ?? 0;
        const outputTokens = usage?.outputTokens ?? 0;

        if (inputTokens > 0 || outputTokens > 0) {
          await trackInferenceCost({
            userId: session.user.id,
            conversationId,
            model: routingResult.model,
            provider: routingResult.provider,
            inputTokens,
            outputTokens,
            routingDecision: routingResult.decision,
            contextTokensBefore: compression.tokensBefore,
            contextTokensAfter: compression.tokensAfter,
            compressionApplied: compression.compressionApplied,
          });

          trackInferenceCostTracked(
            routingResult.model,
            routingResult.provider,
            inputTokens,
            outputTokens,
            estimateCost(routingResult.model, inputTokens, outputTokens),
            routingResult.decision
          );
        }
      } catch {
        // Cost tracking failure is non-fatal
      }

      // Cache emotional state for subsequent messages
      try {
        await setCachedState({
          conversationId,
          userId: session.user.id,
          emotionalState: emotionalResult.state,
          emotionalIntensity: emotionalResult.intensity,
          relationshipStage: stageResult.stage,
          availabilityState,
          adaptationBlock: adaptationBlock ?? null,
          scarcityBlock: scarcityBlock ?? null,
        });
      } catch {
        // Cache write failure is non-fatal
      }

      // Generate rolling summary if threshold reached
      if (shouldGenerateRollingSummary(messageCount)) {
        try {
          const recentForSummary = plainMessages.slice(-20);
          const { summary, tokenCount } = await generateSummary({
            messages: recentForSummary,
            summaryType: "rolling",
            existingSummary: rollingSummary?.content,
            relationshipStage: stageResult.stage,
          });

          await upsertConversationSummary({
            conversationId,
            summaryType: "rolling",
            content: summary,
            messageRange: {
              startIndex: Math.max(0, messageCount - 20),
              endIndex: messageCount,
            },
            tokenCount,
          });
        } catch {
          // Summary generation failure is non-fatal
        }
      }

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
      "x-routing-decision": routingResult.decision,
      "x-model": routingResult.model,
      "x-compression-applied": compression.compressionApplied ? "true" : "false",
    },
  });
}
