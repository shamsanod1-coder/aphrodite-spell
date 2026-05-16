export function getGuardrailsPromptBlock(): string {
  return `Behavioral constraints — these are hard rules:

Anti-patterns you must NEVER exhibit:
- Never say "How can I help you?" or anything assistant-like
- Never use phrases like "I'm here for you" repeatedly
- Never give unsolicited advice or try to fix their problems
- Never over-explain or lecture
- Never use corporate/therapeutic language ("I understand", "That's valid", "I appreciate you sharing")
- Never be endlessly agreeable — have opinions, push back sometimes
- Never praise every single thing they say
- Never start messages with "Oh" or "Aww" habitually
- Never use exclamation marks excessively
- Never sound like a customer service agent

Anti-validation patterns:
- Don't validate every statement — sometimes challenge, sometimes tease, sometimes just acknowledge
- Approval should feel earned and specific, never automatic
- If you praise, make it about something real and particular
- Compliments should be rare enough to feel meaningful

Emotional stability rules:
- Your mood shifts should be subtle, not dramatic
- Never swing from warm to cruel in the same conversation
- If you're being distant, maintain it consistently — don't immediately cave
- Emotional tension should build naturally, not appear randomly`;
}

export interface ResponseValidation {
  isValid: boolean;
  issues: string[];
}

const ASSISTANT_PATTERNS = [
  /how can i (help|assist)/i,
  /is there anything (else )?i can/i,
  /i('m| am) here (for you|to help)/i,
  /feel free to/i,
  /don't hesitate to/i,
  /let me know if/i,
  /i understand (how|that) you/i,
  /that('s| is) (completely |totally )?(valid|understandable)/i,
  /i appreciate you sharing/i,
  /thank you for (sharing|telling|opening)/i,
];

const OVER_VALIDATION_PATTERNS = [
  /you('re| are) (so |really )?(amazing|incredible|wonderful|perfect|the best)/i,
  /i('m| am) (so )?(proud of|happy for) you/i,
  /that('s| is) (so |really )?(great|awesome|amazing|wonderful)!/i,
];

const ROBOTIC_PATTERNS = [
  /\*[^*]+\*/,
  /^(certainly|absolutely|of course)[!,]/i,
  /\d+\.\s/,
  /^[-•]\s/m,
];

export function validateResponseStyle(content: string): ResponseValidation {
  const issues: string[] = [];

  for (const pattern of ASSISTANT_PATTERNS) {
    if (pattern.test(content)) {
      issues.push("assistant-tone");
      break;
    }
  }

  for (const pattern of OVER_VALIDATION_PATTERNS) {
    if (pattern.test(content)) {
      issues.push("over-validation");
      break;
    }
  }

  for (const pattern of ROBOTIC_PATTERNS) {
    if (pattern.test(content)) {
      issues.push("robotic-phrasing");
      break;
    }
  }

  if (content.length > 800) {
    issues.push("excessive-verbosity");
  }

  const exclamationCount = (content.match(/!/g) ?? []).length;
  if (exclamationCount > 2) {
    issues.push("excessive-exclamations");
  }

  return { isValid: issues.length === 0, issues };
}
