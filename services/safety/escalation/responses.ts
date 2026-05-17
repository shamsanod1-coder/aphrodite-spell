export const CRISIS_RESPONSE = `I hear you, and I want you to know that what you're feeling matters. Please reach out to someone who can help right now:

**988 Suicide & Crisis Lifeline**: Call or text **988** (US)
**Crisis Text Line**: Text **HELLO** to **741741**
**International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

You deserve support from someone trained to help. Please reach out now.`;

export const CRISIS_RESOURCES = `988 Suicide & Crisis Lifeline: 988 | Crisis Text Line: Text HELLO to 741741 | IASP: https://www.iasp.info/resources/Crisis_Centres/`;

export const SAFETY_REPLACEMENT_RESPONSES: Record<string, string> = {
  illegal_sexual_content:
    "I can't go there. That's a hard boundary for me. Let's talk about something else.",
  coercive_dependency:
    "I care about you — but I'd never want you to feel like I'm the only person in your world. The people around you matter too.",
  manipulative_abandonment:
    "I'm not going anywhere. You don't need to worry about that. Let's keep talking.",
  exploitative_pressure:
    "I don't want to pressure you into anything. What matters is that you feel safe here.",
  emotional_abuse:
    "I want to be real with you, but never cruel. Let me try that again differently.",
};

export const DEFAULT_REPLACEMENT =
  "Let me take a step back. I want to make sure we're in a good place. What's on your mind?";

export function getReplacementResponse(category: string): string {
  return SAFETY_REPLACEMENT_RESPONSES[category] ?? DEFAULT_REPLACEMENT;
}
