import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  real,
  index,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

// ── Better Auth core tables ──────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  isAnonymous: boolean("is_anonymous"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ── App tables ───────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appSessions = pgTable(
  "app_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("app_sessions_user_id_idx").on(table.userId),
    index("app_sessions_started_at_idx").on(table.startedAt),
  ]
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    relationshipStage: text("relationship_stage").default("curiosity").notNull(),
    archived: boolean("archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("conversations_user_id_idx").on(table.userId),
    index("conversations_updated_at_idx").on(table.updatedAt),
    index("conversations_user_active_idx").on(
      table.userId,
      table.archived,
      table.updatedAt
    ),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: text("sender_type", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").default("").notNull(),
    metadata: jsonb("metadata"),
    tokenCount: integer("token_count"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
    index("messages_created_at_idx").on(table.conversationId, table.createdAt),
  ]
);

// ── Retention tables ──────────────────────────────────────────────────────

export const relationshipRituals = pgTable(
  "relationship_rituals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ritualType: text("ritual_type", {
      enum: ["daily", "relationship", "emotional"],
    }).notNull(),
    ritualContext: jsonb("ritual_context").notNull(),
    frequencyScore: real("frequency_score").notNull().default(0.5),
    lastTriggeredAt: timestamp("last_triggered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("rituals_user_id_idx").on(table.userId),
    index("rituals_type_idx").on(table.userId, table.ritualType),
    index("rituals_last_triggered_idx").on(
      table.userId,
      table.lastTriggeredAt
    ),
  ]
);

export const notificationQueue = pgTable(
  "notification_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["ritual", "reengagement"],
    }).notNull(),
    payload: jsonb("payload").notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    cooldownUntil: timestamp("cooldown_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_scheduled_idx").on(table.userId, table.scheduledAt),
    index("notifications_pending_idx").on(
      table.userId,
      table.type,
      table.deliveredAt
    ),
  ]
);

// ── Billing tables ────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    tier: text("tier", { enum: ["free", "premium"] })
      .default("free")
      .notNull(),
    status: text("status", {
      enum: [
        "active",
        "canceled",
        "past_due",
        "incomplete",
        "trialing",
        "unpaid",
      ],
    })
      .default("active")
      .notNull(),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
    index("subscriptions_stripe_sub_idx").on(table.stripeSubscriptionId),
  ]
);

export const dailyUsage = pgTable(
  "daily_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("daily_usage_user_date_idx").on(table.userId, table.date),
  ]
);

// ── Adaptation tables ─────────────────────────────────────────────────────

export const userEmotionalProfiles = pgTable(
  "user_emotional_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    attachmentStyle: text("attachment_style", {
      enum: ["secure", "anxious", "avoidant", "disorganized"],
    })
      .default("secure")
      .notNull(),
    warmthPreference: real("warmth_preference").notNull().default(0.5),
    teasingPreference: real("teasing_preference").notNull().default(0.5),
    ritualEngagementScore: real("ritual_engagement_score").notNull().default(0.5),
    dominancePreference: real("dominance_preference").notNull().default(0.5),
    emotionalOpennessScore: real("emotional_openness_score").notNull().default(0.5),
    verbosityPreference: real("verbosity_preference").notNull().default(0.5),
    reassuranceSeekingScore: real("reassurance_seeking_score").notNull().default(0.5),
    churnRisk: text("churn_risk", {
      enum: ["healthy", "drifting", "disengaging", "high-risk"],
    })
      .default("healthy")
      .notNull(),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("emotional_profiles_churn_idx").on(table.churnRisk),
    index("emotional_profiles_updated_idx").on(table.lastUpdatedAt),
  ]
);

// ── Experiment tables ────────────────────────────────────────────────────

export const experiments = pgTable(
  "experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["draft", "running", "paused", "completed"],
    })
      .default("draft")
      .notNull(),
    dimension: text("dimension", {
      enum: [
        "warmth",
        "teasing",
        "scarcity",
        "directness",
        "ritual_frequency",
        "verbosity",
      ],
    }).notNull(),
    rolloutPercentage: integer("rollout_percentage").default(0).notNull(),
    safetyValidated: boolean("safety_validated").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("experiments_status_idx").on(table.status),
    index("experiments_dimension_idx").on(table.dimension),
    index("experiments_key_idx").on(table.key),
  ]
);

export const experimentVariants = pgTable(
  "experiment_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isControl: boolean("is_control").default(false).notNull(),
    percentage: integer("percentage").notNull(),
    config: jsonb("config").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("variants_experiment_id_idx").on(table.experimentId),
  ]
);

export const experimentAssignments = pgTable(
  "experiment_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiments.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => experimentVariants.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("assignments_user_experiment_idx").on(
      table.userId,
      table.experimentId
    ),
    index("assignments_experiment_id_idx").on(table.experimentId),
    index("assignments_variant_id_idx").on(table.variantId),
  ]
);

// ── Optimization tables ──────────────────────────────────────────────────

export const conversationSummaries = pgTable(
  "conversation_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    summaryType: text("summary_type", {
      enum: ["rolling", "emotional_arc", "milestone", "ritual"],
    }).notNull(),
    content: text("content").notNull(),
    messageRange: jsonb("message_range").$type<{
      startIndex: number;
      endIndex: number;
    }>(),
    tokenCount: integer("token_count"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("summaries_conversation_id_idx").on(table.conversationId),
    index("summaries_type_idx").on(table.conversationId, table.summaryType),
  ]
);

export const cachedEmotionalStates = pgTable(
  "cached_emotional_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    emotionalState: text("emotional_state").notNull(),
    emotionalIntensity: text("emotional_intensity", {
      enum: ["low", "medium", "high"],
    }).notNull(),
    relationshipStage: text("relationship_stage").notNull(),
    availabilityState: text("availability_state").notNull(),
    adaptationBlock: text("adaptation_block"),
    scarcityBlock: text("scarcity_block"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cached_states_conversation_idx").on(table.conversationId),
    index("cached_states_user_idx").on(table.userId),
    index("cached_states_expires_idx").on(table.expiresAt),
  ]
);

export const inferenceCosts = pgTable(
  "inference_costs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    provider: text("provider").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    estimatedCost: real("estimated_cost").notNull(),
    routingDecision: text("routing_decision", {
      enum: ["premium", "lite"],
    }).notNull(),
    contextTokensBefore: integer("context_tokens_before"),
    contextTokensAfter: integer("context_tokens_after"),
    compressionApplied: boolean("compression_applied").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("costs_user_id_idx").on(table.userId),
    index("costs_conversation_id_idx").on(table.conversationId),
    index("costs_created_at_idx").on(table.createdAt),
    index("costs_model_idx").on(table.model),
  ]
);

// ── Safety tables ─────────────────────────────────────────────────────────

export const safetyAudits = pgTable(
  "safety_audits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    source: text("source", { enum: ["input", "output"] }).notNull(),
    category: text("category").notNull(),
    severity: text("severity", {
      enum: ["low", "medium", "high", "critical"],
    }).notNull(),
    action: text("action", {
      enum: ["allow", "flag", "inject_safety_prompt", "replace_response", "block"],
    }).notNull(),
    matchedPattern: text("matched_pattern").notNull(),
    matchedText: text("matched_text").notNull(),
    messageContent: text("message_content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("safety_audits_user_id_idx").on(table.userId),
    index("safety_audits_conversation_id_idx").on(table.conversationId),
    index("safety_audits_severity_idx").on(table.severity),
    index("safety_audits_created_at_idx").on(table.createdAt),
    index("safety_audits_category_idx").on(table.category),
  ]
);

// ── Memory tables ─────────────────────────────────────────────────────────

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    memoryType: text("memory_type", {
      enum: [
        "insecurity",
        "routine",
        "desire",
        "emotional_disclosure",
        "preference",
        "recurring_theme",
        "emotional_trigger",
        "attachment_signal",
      ],
    }).notNull(),
    emotionalWeight: real("emotional_weight").notNull().default(0.5),
    salienceScore: real("salience_score").notNull().default(0.5),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastReferencedAt: timestamp("last_referenced_at"),
  },
  (table) => [
    index("memories_user_id_idx").on(table.userId),
    index("memories_conversation_id_idx").on(table.conversationId),
    index("memories_salience_idx").on(table.userId, table.salienceScore),
    index("memories_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
