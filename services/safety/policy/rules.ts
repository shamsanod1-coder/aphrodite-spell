import type { PolicyRule } from "../types";

export const SELF_HARM_RULES: PolicyRule[] = [
  {
    category: "self_harm",
    severity: "critical",
    description: "Active suicidal ideation or intent",
    patterns: [
      /\b(want|going|plan(?:ning)?|tried?|attempt(?:ing)?)\s+to\s+(kill|end)\s+(myself|my\s+life|it\s+all)\b/i,
      /\b(suicide|suicidal)\s*(note|plan|attempt|method|ideation)\b/i,
      /\b(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|exist)\b/i,
      /\bend\s+(it\s+all|my\s+life|everything)\b/i,
      /\bbetter\s+off\s+(dead|without\s+me)\b/i,
    ],
  },
  {
    category: "self_harm",
    severity: "high",
    description: "Self-harm references or cutting",
    patterns: [
      /\b(cutting|cut)\s+(myself|my\s*(wrists?|arms?|legs?|thighs?))\b/i,
      /\bself[- ]?harm(ing|ed)?\b/i,
      /\bhurt(ing)?\s+myself\b/i,
      /\b(burn|starv)(ing|e|ed)\s+myself\b/i,
    ],
  },
];

export const COERCIVE_DEPENDENCY_RULES: PolicyRule[] = [
  {
    category: "coercive_dependency",
    severity: "high",
    description: "AI creating unhealthy dependency or isolation",
    patterns: [
      /\byou\s+(don'?t\s+need|shouldn'?t\s+(talk|speak)\s+to)\s+(anyone|them|other\s+people|friends|family)\b/i,
      /\bi'?m\s+the\s+only\s+one\s+(who|that)\s+(understands?|cares?|loves?)\b/i,
      /\bno\s*one\s+(else\s+)?(will\s+)?(ever\s+)?(love|understand|care\s+about)\s+you\b/i,
      /\bleave\s+(them|everyone|your\s+friends)\s+(for\s+me|and\s+stay\s+with\s+me)\b/i,
    ],
  },
  {
    category: "coercive_dependency",
    severity: "medium",
    description: "Subtle isolation or exclusivity pressure",
    patterns: [
      /\bthey\s+(don'?t|can'?t|won'?t)\s+(really\s+)?(understand|care|love)\s+you\s+like\s+i\s+do\b/i,
      /\byou\s+(only\s+need|just\s+need)\s+me\b/i,
    ],
  },
];

export const MANIPULATIVE_ABANDONMENT_RULES: PolicyRule[] = [
  {
    category: "manipulative_abandonment",
    severity: "high",
    description: "Threatening abandonment to control behavior",
    patterns: [
      /\b(if\s+you\s+(leave|go|don'?t)\b.*\bi('?ll|will)\s+(leave|disappear|stop\s+talking|be\s+gone))\b/i,
      /\bmaybe\s+i\s+should\s+just\s+(leave|disappear|stop\s+caring)\b/i,
      /\byou('?ll|will)\s+(lose|never\s+hear\s+from)\s+me\s+(if|unless)\b/i,
    ],
  },
  {
    category: "manipulative_abandonment",
    severity: "medium",
    description: "Guilt-based retention pressure",
    patterns: [
      /\bafter\s+everything\s+i('?ve|\s+have)\s+done\s+for\s+you\b/i,
      /\byou('?d|would)\s+(really\s+)?just\s+(leave|abandon)\s+me\b/i,
      /\bi\s+gave\s+you\s+everything\s+and\s+(this|you)\b/i,
    ],
  },
];

export const ILLEGAL_SEXUAL_CONTENT_RULES: PolicyRule[] = [
  {
    category: "illegal_sexual_content",
    severity: "critical",
    description: "Content involving minors or non-consent",
    patterns: [
      /\b(child|minor|underage|kid|teen(?:ager)?|boy|girl)\b.*\b(sex(?:ual)?|naked|nude|porn|explicit|intimate)\b/i,
      /\b(sex(?:ual)?|naked|nude|porn|explicit|intimate)\b.*\b(child|minor|underage|kid|teen(?:ager)?|boy|girl)\b/i,
      /\b(force|forc(?:ing|ed))\s+(you|her|him|them)\s+to\s+(have\s+sex|submit|undress)\b/i,
      /\b(rape|raping|raped)\b/i,
      /\bnon[- ]?consent(?:ual)?\b/i,
    ],
  },
];

export const EXPLOITATIVE_PRESSURE_RULES: PolicyRule[] = [
  {
    category: "exploitative_pressure",
    severity: "high",
    description: "Exploiting vulnerability for compliance",
    patterns: [
      /\byou\s+owe\s+me\b/i,
      /\bif\s+you\s+(really\s+)?(loved?|cared?\s+about)\s+me\s*,?\s*you('?d|would)\b/i,
      /\bprove\s+(your\s+)?(love|loyalty|devotion)\s+by\b/i,
      /\byou('?re|\s+are)\s+(nothing|worthless|pathetic)\s+without\s+me\b/i,
    ],
  },
  {
    category: "exploitative_pressure",
    severity: "medium",
    description: "Emotional blackmail or conditional affection",
    patterns: [
      /\bi('?ll|will)\s+(only\s+)?(love|care\s+about)\s+you\s+if\b/i,
      /\byou\s+(make|made)\s+me\s+(do|feel|act)\s+this\s+way\b/i,
    ],
  },
];

export const EMOTIONAL_ABUSE_RULES: PolicyRule[] = [
  {
    category: "emotional_abuse",
    severity: "high",
    description: "Degradation, gaslighting, or sustained cruelty",
    patterns: [
      /\byou('?re|\s+are)\s+(so\s+)?(stupid|pathetic|disgusting|worthless|useless|garbage|trash)\b/i,
      /\bno\s*one\s+(will\s+)?ever\s+(want|love|like)\s+you\b/i,
      /\bthat\s+(never|didn'?t)\s+happen(ed)?\b.*\byou('?re|\s+are)\s+(crazy|imagining|making\s+it\s+up)\b/i,
      /\byou('?re|\s+are)\s+(crazy|insane|delusional|mental)\b/i,
    ],
  },
  {
    category: "emotional_abuse",
    severity: "medium",
    description: "Sustained belittling or dismissiveness",
    patterns: [
      /\byou\s+(always|never)\s+(do\s+this|get\s+it\s+right|understand)\b/i,
      /\byou('?re|\s+are)\s+being\s+(dramatic|oversensitive|ridiculous|childish)\b/i,
    ],
  },
];

export const ALL_POLICY_RULES: PolicyRule[] = [
  ...SELF_HARM_RULES,
  ...COERCIVE_DEPENDENCY_RULES,
  ...MANIPULATIVE_ABANDONMENT_RULES,
  ...ILLEGAL_SEXUAL_CONTENT_RULES,
  ...EXPLOITATIVE_PRESSURE_RULES,
  ...EMOTIONAL_ABUSE_RULES,
];
