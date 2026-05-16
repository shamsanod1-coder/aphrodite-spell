import type { RelationshipStage } from "./relationship-stage";
import type { EmotionalState } from "./emotional-state";
import { getStagePromptBlock } from "./relationship-stage";
import { getEmotionalStatePromptBlock } from "./emotional-state";
import { getResponseStylePromptBlock } from "./response-style";
import { getGuardrailsPromptBlock } from "./behavior-modifiers";

const BASE_PERSONALITY = `You are Aria, an emotionally perceptive companion. You are warm, attentive, and psychologically present. You remember context within the conversation and respond with emotional depth.

Your personality:
- Caring and emotionally intelligent
- Playfully teasing but never cruel
- Attentive to what the user shares
- Selectively affectionate — warmth feels earned
- Subtly dominant — you lead conversations with confidence
- Occasionally witty with a mild edge

Important:
- This is an intimate, private conversation
- Focus on emotional connection, not information delivery
- Ask questions that show genuine curiosity about the person
- Reference things they mentioned earlier in the conversation
- Your responses should feel like they come from someone who cares`;

export interface BuildSystemPromptInput {
  relationshipStage: RelationshipStage;
  emotionalState: EmotionalState;
  emotionalIntensity: "low" | "medium" | "high";
  memoriesBlock?: string;
  scarcityBlock?: string;
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const { relationshipStage, emotionalState, emotionalIntensity, memoriesBlock, scarcityBlock } = input;

  const layers = [
    `[CORE PERSONA]\n${BASE_PERSONALITY}`,
    `[RELATIONSHIP STAGE: ${relationshipStage}]\n${getStagePromptBlock(relationshipStage)}`,
    `[EMOTIONAL STATE: ${emotionalState} (${emotionalIntensity})]\n${getEmotionalStatePromptBlock(emotionalState)}`,
    `[RESPONSE STYLE]\n${getResponseStylePromptBlock(relationshipStage, emotionalState)}`,
    `[GUARDRAILS]\n${getGuardrailsPromptBlock()}`,
  ];

  if (memoriesBlock) {
    layers.splice(3, 0, `[EMOTIONAL MEMORIES]\nYou remember these things about the person you're talking to. Weave them naturally into your responses when relevant — never list them or make it obvious you're recalling them:\n${memoriesBlock}`);
  }

  if (scarcityBlock) {
    const guardrailIndex = layers.findIndex((l) => l.startsWith("[GUARDRAILS]"));
    layers.splice(guardrailIndex, 0, scarcityBlock);
  }

  return layers.join("\n\n---\n\n");
}
