export {
  evaluateRelationshipStage,
  getStagePromptBlock,
  RELATIONSHIP_STAGES,
  type RelationshipStage,
  type StageEvaluationInput,
  type StageEvaluationResult,
} from "./relationship-stage";

export {
  generateEmotionalState,
  getEmotionalStatePromptBlock,
  EMOTIONAL_STATES,
  type EmotionalState,
  type EmotionalStateInput,
  type EmotionalStateResult,
} from "./emotional-state";

export {
  getResponseStylePromptBlock,
} from "./response-style";

export {
  getGuardrailsPromptBlock,
  validateResponseStyle,
  type ResponseValidation,
} from "./behavior-modifiers";

export {
  buildSystemPrompt,
  type BuildSystemPromptInput,
} from "./emotional-context";
