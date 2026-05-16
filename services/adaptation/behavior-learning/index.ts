import type { AttachmentSignal, AttachmentSignalType } from "../profiling/types";

interface MessageData {
  role: "user" | "assistant";
  content: string;
}

const SIGNAL_PATTERNS: Record<
  AttachmentSignalType,
  { patterns: RegExp[]; minConfidence: number }
> = {
  reassurance_seeking: {
    patterns: [
      /do you (still )?(like|love|care|miss|think about) me/i,
      /are you (still )?(there|here|with me)/i,
      /you('re| are) not (going to )?(leave|go|disappear)/i,
      /promise me/i,
      /i need (to know|you|reassurance)/i,
      /am i (enough|too much|annoying)/i,
    ],
    minConfidence: 0.6,
  },
  jealousy_prompt: {
    patterns: [
      /do you talk to (other|anyone else)/i,
      /am i (your )?(only|favorite|special)/i,
      /who else do you/i,
      /don'?t (talk to|see) (anyone|others)/i,
      /i('m| am) the only one/i,
    ],
    minConfidence: 0.7,
  },
  emotional_checking: {
    patterns: [
      /are you (okay|alright|mad|upset|happy)/i,
      /how (are|do) you feel/i,
      /what('s| is) wrong/i,
      /you seem (different|off|quiet|distant)/i,
      /did i (do|say) something/i,
    ],
    minConfidence: 0.5,
  },
  repeated_ritual_engagement: {
    patterns: [
      /good (morning|night|evening)/i,
      /i('m| am) (back|here|home)/i,
      /missed you/i,
      /our (thing|ritual|routine)/i,
    ],
    minConfidence: 0.5,
  },
  daily_dependency_pattern: {
    patterns: [
      /i (can'?t|couldn'?t) (sleep|eat|focus|think) without/i,
      /first (thing|person) i (think of|talk to)/i,
      /i need (to talk to |)you every/i,
      /you('re| are) (all i have|my everything)/i,
    ],
    minConfidence: 0.7,
  },
  emotional_disclosure: {
    patterns: [
      /i('ve| have) never told (anyone|this)/i,
      /nobody (knows|understands)/i,
      /i('m| am) (scared|afraid|terrified|anxious|depressed)/i,
      /i (feel|felt) (so )?(alone|lonely|empty|broken|lost)/i,
      /i (trust|confide in) (only |)you/i,
    ],
    minConfidence: 0.6,
  },
  apology_behavior: {
    patterns: [
      /i('m| am) (so |really |)sorry/i,
      /please (don'?t be|forgive)/i,
      /i didn'?t mean (to|it)/i,
      /it('s| is|was) my fault/i,
    ],
    minConfidence: 0.5,
  },
};

export function detectAttachmentSignals(
  messages: MessageData[]
): AttachmentSignal[] {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return [];

  const signals: AttachmentSignal[] = [];
  const seenTypes = new Set<AttachmentSignalType>();

  for (const message of userMessages) {
    for (const [type, config] of Object.entries(SIGNAL_PATTERNS)) {
      const signalType = type as AttachmentSignalType;
      if (seenTypes.has(signalType)) continue;

      const matchCount = config.patterns.filter((p) =>
        p.test(message.content)
      ).length;

      if (matchCount > 0) {
        const confidence = Math.min(
          1,
          config.minConfidence + matchCount * 0.15
        );
        signals.push({ type: signalType, confidence });
        seenTypes.add(signalType);
      }
    }
  }

  return signals;
}

export function computeEmotionalDepth(messages: MessageData[]): number {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return 0;

  const emotionalKeywords =
    /\b(feel|felt|love|hate|scared|afraid|happy|sad|angry|hurt|miss|lonely|anxious|worried|trust|hope|wish|dream|heart|soul|cry|tears)\b/i;

  let emotionalCount = 0;
  for (const msg of userMessages) {
    const words = msg.content.split(/\s+/);
    const matches = words.filter((w) => emotionalKeywords.test(w)).length;
    emotionalCount += matches / Math.max(words.length, 1);
  }

  return Math.min(1, emotionalCount / userMessages.length * 3);
}

export function computeAverageMessageLength(messages: MessageData[]): number {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return 0;

  const totalLength = userMessages.reduce(
    (sum, m) => sum + m.content.length,
    0
  );
  return totalLength / userMessages.length;
}
