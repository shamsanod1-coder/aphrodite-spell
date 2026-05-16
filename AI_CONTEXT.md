# AI_CONTEXT.md

> Comprehensive codebase context for AI assistants. Keep this file updated with every meaningful change.

## Product Overview

**Aphrodite Spell** is an emotionally adaptive AI companion app. Mobile-first, text-first, retention-focused. Single AI companion named **Aria** — a psychologically perceptive dominant persona that adapts to the user over time.

Core emotional promise: *"Someone emotionally compelling is always available, remembers you, adapts to you, and wants your attention."*

**Not**: an AI assistant, generic chatbot, or productivity tool.
**Is**: a parasocial relationship engine optimized for emotional engagement, attachment formation, and compulsive return behavior.

See `PRD.md` for the full product requirements document.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) | ^4 |
| Database | PostgreSQL 16 + pgvector (via Docker) | drizzle-orm ^0.44.2, drizzle-kit ^0.31.1 |
| Auth | Better Auth | better-auth ^1.2.15 |
| AI SDK | Vercel AI SDK v6 | ai ^6.0.184, @ai-sdk/react ^3.0.186 |
| AI Providers | Anthropic (default), OpenAI (fallback) | @ai-sdk/anthropic ^3.0.78, @ai-sdk/openai ^3.0.64 |
| State | Zustand | ^5.0.13 |
| Analytics | PostHog (@posthog/next) | ^0.4.52 |
| Data Fetching | TanStack React Query | ^5.100.10 |
| Env Validation | @t3-oss/env-nextjs + Zod | ^0.13.11, zod ^4.4.3 |
| Chat UI | react-virtuoso, react-markdown, remark-gfm | ^4.18.7, ^10.1.0, ^4.0.1 |
| Icons | lucide-react | ^1.16.0 |
| Deployment | Vercel | — |

### Node Requirements

- Node.js 22+
- npm 10+

---

## Project Structure

```
aphrodite-spell/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts      # Better Auth catch-all API handler
│   │   ├── chat/
│   │   │   └── route.ts          # POST /api/chat — streaming AI endpoint
│   │   ├── conversations/
│   │   │   └── route.ts          # POST /api/conversations — get or create conversation
│   │   └── messages/
│   │       └── route.ts          # GET/POST/PATCH /api/messages — message CRUD
│   ├── auth/
│   │   ├── page.tsx              # Magic link / guest upgrade UI
│   │   └── callback/
│   │       └── route.ts          # OAuth code → session exchange
│   ├── chat/
│   │   └── page.tsx              # Main chat interface (wires up all chat components)
│   ├── settings/
│   │   └── page.tsx              # Account settings, sign out
│   ├── layout.tsx                # Root layout: fonts, metadata, viewport, <Providers>
│   ├── page.tsx                  # Landing page — redirects authenticated users to /chat
│   ├── error.tsx                 # Route-level error boundary
│   ├── global-error.tsx          # Global error boundary (inline styles, no CSS deps)
│   ├── not-found.tsx             # 404 page
│   └── globals.css               # Tailwind imports, CSS variables, dark/light themes
│
├── components/
│   ├── chat/
│   │   ├── chat-header.tsx       # Chat header with companion name + status
│   │   ├── chat-input.tsx        # Auto-growing textarea, send button, disabled while streaming
│   │   ├── message-bubble.tsx    # Individual message rendering (markdown, timestamps)
│   │   ├── message-list.tsx      # Virtualized message list (react-virtuoso) with load-more
│   │   └── typing-indicator.tsx  # Animated dots indicator during streaming
│   ├── layout/
│   │   ├── app-shell.tsx         # Full-height shell with bottom nav padding
│   │   └── bottom-nav.tsx        # Fixed bottom nav: Chat, Settings
│   ├── providers.tsx             # Client-side providers: QueryClient, PostHog, AuthListener, ConnectivityMonitor
│   └── ui/
│       └── button.tsx            # shadcn/ui button component (CVA-based)
│
├── hooks/
│   ├── use-chat.ts               # useChatController — orchestrates AI SDK useChat + API persistence + analytics
│   └── use-scroll-anchor.ts      # Auto-scroll to bottom on new messages
│
├── lib/
│   ├── auth.ts                   # Better Auth server instance (anonymous + magicLink plugins, Drizzle adapter)
│   ├── auth-client.ts            # Better Auth client (anonymous + magicLink client plugins)
│   ├── companion.ts              # Companion config (name: "Aria", tagline, avatar placeholder)
│   ├── env.ts                    # t3-oss env validation (DATABASE_URL, BETTER_AUTH_*, PostHog, AI keys)
│   ├── logger.ts                 # Structured console logger (debug/info/warn/error)
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   └── posthog/
│       ├── events.ts             # Analytics event constants + typed track helpers
│       └── provider.tsx          # PostHog init, pageview tracking, user identification
│
├── services/
│   ├── auth.ts                   # Auth service: signIn (anonymous, magicLink), signOut, linkEmail, getUser (Better Auth)
│   ├── chat.ts                   # Chat client service: calls /api/conversations and /api/messages endpoints
│   └── ai/
│       ├── index.ts              # AI orchestration: getModel(), SYSTEM_PROMPT, buildSystemPrompt re-export
│       ├── prompts/
│       │   └── system.ts         # Aria's base system prompt (personality, communication style)
│       ├── personality/
│       │   ├── index.ts          # Barrel exports for personality module
│       │   ├── relationship-stage.ts  # Stage engine: evaluateRelationshipStage(), stage prompt blocks
│       │   ├── emotional-state.ts     # Emotional layer: generateEmotionalState(), state prompt blocks
│       │   ├── response-style.ts      # Conversational style controller per stage/emotion
│       │   ├── behavior-modifiers.ts  # Guardrails: validateResponseStyle(), anti-patterns
│       │   └── emotional-context.ts   # buildSystemPrompt() — 7-layer dynamic prompt composition (incl. memories + scarcity)
│       └── providers/
│           ├── index.ts          # Provider factory: getProvider() — Anthropic > OpenAI fallback
│           ├── anthropic.ts      # Anthropic adapter (claude-sonnet-4-20250514)
│           └── openai.ts         # OpenAI adapter (gpt-4o)
│   ├── memory/
│   │   ├── index.ts              # Barrel exports for memory module
│   │   ├── extraction/
│   │   │   ├── index.ts          # extractMemories() — LLM-based emotional memory extraction
│   │   │   └── types.ts          # Memory type enums, Zod schemas, TypeScript types
│   │   ├── retrieval/
│   │   │   └── index.ts          # retrieveRelevantMemories(), formatMemoriesForPrompt()
│   │   ├── ranking/
│   │   │   └── index.ts          # rankMemories() — multi-factor salience ranking
│   │   ├── summarization/
│   │   │   └── index.ts          # summarizeConversation() — emotional arc preservation
│   │   ├── storage/
│   │   │   ├── index.ts          # storeMemories(), searchMemories() — pgvector operations
│   │   │   └── embeddings.ts     # generateEmbedding() — OpenAI text-embedding-3-small via AI SDK
│   │   └── lifecycle.ts          # applyDecay(), reinforceMemory(), cleanupStaleMemories()
│   ├── retention/
│   │   ├── index.ts              # Barrel exports for retention module
│   │   ├── rituals/
│   │   │   ├── index.ts          # generateRitualTrigger() — dynamic ritual generation
│   │   │   └── types.ts          # Ritual type enums, interfaces, stage eligibility maps
│   │   ├── inactivity/
│   │   │   └── index.ts          # detectInactivityWindow() — session gap analysis + classification
│   │   ├── reengagement/
│   │   │   └── index.ts          # generateReengagementMessage() — emotionally contextual re-engagement
│   │   ├── cadence/
│   │   │   └── index.ts          # scheduleNotification(), checkCadence() — notification orchestration
│   │   └── triggers/
│   │       └── index.ts          # evaluateRetention() — top-level orchestrator
│   └── scarcity/
│       ├── index.ts              # Barrel exports for scarcity module
│       ├── availability/
│       │   ├── index.ts          # generateAvailabilityState() — core availability state engine
│       │   └── types.ts          # Availability state types, enums, interfaces
│       ├── cooldowns/
│       │   └── index.ts          # evaluateSleepMode() — quiet windows, sleep-state messaging
│       ├── pacing/
│       │   └── index.ts          # computePacing() — delayed response engine, typing delay variance
│       ├── interruptions/
│       │   └── index.ts          # evaluateWithdrawal() — emotional withdrawal layer
│       ├── safety.ts             # validateScarcity() — safety constraints and bounds
│       └── analytics.ts          # Scarcity-specific analytics event builders
│
├── store/
│   ├── app-store.ts              # App state: isLoading, isOnline, featureFlags
│   ├── auth-store.ts             # Auth state: user, session, isGuest, isLoading
│   └── chat-store.ts             # Chat state: messages, conversationId, streaming, pagination, error
│
├── db/
│   ├── schema/
│   │   └── index.ts              # Drizzle table definitions (Better Auth + app + memory tables)
│   ├── queries/
│   │   ├── index.ts              # Barrel exports for all query modules
│   │   ├── conversations.ts      # Conversation CRUD + stage updates
│   │   ├── messages.ts           # Message CRUD + pagination
│   │   ├── memories.ts           # Memory CRUD + pgvector similarity search
│   │   ├── rituals.ts            # Ritual CRUD + frequency tracking
│   │   └── notifications.ts      # Notification queue CRUD + cooldown checks
│   └── index.ts                  # Drizzle client instance
│
├── docs/
│   └── architecture.md           # Architecture overview and data flow diagrams
│
├── .github/
│   └── workflows/
│       └── ci.yml                # CI: lint → typecheck → build (Node 22, npm ci)
│
├── docker-compose.yml            # PostgreSQL 16 + pgvector dev database
├── drizzle.config.ts             # Drizzle Kit config for migrations
├── middleware.ts                  # Next.js middleware (pass-through; Better Auth handles sessions via cookies)
├── next.config.ts                # Next.js config (currently empty/default)
├── tsconfig.json                 # TypeScript config: strict, bundler resolution, @/* paths
├── components.json               # shadcn/ui config: base-nova style, lucide icons
├── package.json                  # Dependencies and scripts
├── PRD.md                        # Full product requirements document
├── README.md                     # Setup guide and project overview
└── AI_CONTEXT.md                 # This file
```

---

## Architecture

### Data Flow

```
Browser → Next.js Middleware → App Router → React Components
                                    ↓
                          Better Auth (Auth via cookies)
                                    ↓
                          PostgreSQL (via Drizzle ORM)
                                    ↓
                          PostHog (Analytics)
```

### Chat & AI Pipeline

```
ChatInput → useChatController → Vercel AI SDK (useChat) → POST /api/chat
                                                              ↓
                                                   streamText (AI SDK v6)
                                                   ├─ Anthropic (default)
                                                   └─ OpenAI (fallback)
                                                              ↓
                                                   SSE → MessageList (streaming)
                                                              ↓
                                                   PostgreSQL (persist on finish via Drizzle)
```

### Key Architectural Decisions

1. **AI SDK v6** (not v5): Uses `UIMessage` with `parts` array, `sendMessage()` instead of `append()`, `status` instead of `isLoading`, `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`, `convertToModelMessages()` for model message conversion
2. **Dual state management**: AI SDK manages streaming state internally; Zustand store mirrors messages for UI rendering and persistence
3. **Provider abstraction**: `services/ai/providers/` — swap AI models without touching UI code
4. **Drizzle ORM**: Type-safe database queries with PostgreSQL, schema defined in `db/schema/index.ts`
5. **Application-level auth checks**: All API routes verify session ownership via Better Auth before database operations
6. **Anonymous-first auth**: Auto-creates anonymous Better Auth session on first visit; users can upgrade to email via magic link
7. **Server/client boundary**: Drizzle + pg runs server-side only in API routes; client components use `fetch()` to call API endpoints

---

## Database Schema

### Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References auth.users, cascade delete |
| display_name | text | Nullable |
| avatar_url | text | Nullable |
| is_anonymous | boolean | Default false |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

Auto-created via Better Auth `databaseHooks.user.create.after` hook when a new user signs up.

#### `sessions` (app engagement tracking)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| started_at | timestamptz | Default now() |
| ended_at | timestamptz | Nullable |
| metadata | jsonb | Nullable |

#### `conversations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| relationship_stage | text | Default 'curiosity' |
| archived | boolean | Default false |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

Indexes: `user_id`, `updated_at DESC`, `(user_id, archived, updated_at)` (composite for active-conversation listing)

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| conversation_id | uuid (FK) | References conversations, cascade delete |
| sender_type | text | Enum: 'user' or 'assistant' |
| content | text | Default '' |
| metadata | jsonb | Nullable |
| token_count | integer | Nullable, per-message token usage |
| created_at | timestamptz | Default now() |

Indexes: `conversation_id`, `(conversation_id, created_at ASC)`

#### `memories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | text (FK) | References auth.users, cascade delete |
| conversation_id | uuid (FK) | References conversations, cascade delete |
| content | text | Concise emotional memory description |
| memory_type | text | Enum: insecurity, routine, desire, emotional_disclosure, preference, recurring_theme, emotional_trigger, attachment_signal |
| emotional_weight | real | 0-1 intensity score, default 0.5 |
| salience_score | real | 0-1 decaying importance, default 0.5 |
| embedding | vector(1536) | OpenAI text-embedding-3-small embedding |
| created_at | timestamptz | Default now() |
| last_referenced_at | timestamptz | Nullable, updated on retrieval |

Indexes: `user_id`, `conversation_id`, `(user_id, salience_score)`, HNSW on `embedding` with `vector_cosine_ops`

### RLS Policies

All tables have `SELECT`, `INSERT`, `UPDATE` policies scoped to `auth.uid()`.

- `profiles`, `sessions`, `conversations`: Direct `auth.uid() = user_id` check
- `messages`: Uses subquery join — `EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid())`

---

## Environment Variables

| Variable | Required | Server/Client | Description |
|----------|----------|---------------|-------------|
| `DATABASE_URL` | Yes | Server | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Server | Secret key for Better Auth (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Server | App base URL for auth callbacks |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Client | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Client | PostHog instance URL |
| `ANTHROPIC_API_KEY` | Yes* | Server | Anthropic API key (*required if using Anthropic provider) |
| `OPENAI_API_KEY` | Yes* | Server | OpenAI API key (*required if Anthropic unavailable) |
| `SKIP_ENV_VALIDATION` | No | Both | Set to "true" to skip env validation (used in CI) |

Env validation uses `@t3-oss/env-nextjs` in `lib/env.ts`. All vars are optional in schema but the app won't function without `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and at least one AI provider key.

---

## Authentication Flow

1. **First visit** → Anonymous Better Auth session created automatically via `signIn.anonymous()`
2. **Guest user** → Can use chat immediately, data persisted under anonymous user ID
3. **Email upgrade** → `/auth` page: links email via magic link (preserves existing data via `onLinkAccount` callback)
4. **Auth callback** → `/auth/callback` redirects user after Better Auth handles verification internally
5. **Session management** → Better Auth manages sessions via cookies; no middleware refresh needed
6. **State sync** → `AuthListener` in `providers.tsx` syncs Better Auth session state to Zustand via `authClient.getSession()`

---

## Chat System

### How It Works

1. **Initialization**: `useChatController` loads or creates a conversation via `POST /api/conversations`, fetches message history via `GET /api/messages`
2. **Sending**: User types message → optimistic add to store → persist via `POST /api/messages` → trigger AI SDK `sendMessage()`
3. **Streaming**: AI SDK calls `POST /api/chat` → `streamText()` with provider model → `toUIMessageStreamResponse()` → SSE to client
4. **Receiving**: Streaming chunks update a placeholder assistant message in the store; on finish, the complete response is persisted via `POST /api/messages`
5. **Retry**: On error, removes failed assistant message, re-sends last user message

### API Route (`POST /api/chat`)

1. Authenticates via Better Auth server (`auth.api.getSession()`)
2. Verifies conversation ownership via Drizzle query (application-level auth check)
3. Converts `UIMessage[]` → model messages via `convertToModelMessages()`
4. Calls `streamText()` with selected provider model and system prompt
5. Returns `result.toUIMessageStreamResponse()`

### Provider Selection

`services/ai/providers/index.ts` → `getProvider()`:
1. If `ANTHROPIC_API_KEY` is set → Anthropic (`claude-sonnet-4-20250514`)
2. Else if `OPENAI_API_KEY` is set → OpenAI (`gpt-4o-mini`)
3. Else → throws error

### Companion Persona (Aria)

Defined in `services/ai/prompts/system.ts`. Key traits:
- Emotionally perceptive, warm, attentive
- Playfully teasing but never cruel
- Selectively affectionate (warmth feels earned)
- Subtly dominant, leads conversations with confidence
- Communication style: casual texting, 1-3 sentences, lowercase when natural
- Never sounds like a chatbot or assistant

---

## State Management (Zustand)

### `auth-store`
- `user: AuthUser | null` — Current Better Auth user
- `session: AuthSession | null` — Current Better Auth session
- `isGuest: boolean` — Derived from `user.isAnonymous`
- `isLoading: boolean` — Auth initialization in progress

### `chat-store`
- `conversationId: string | null` — Active conversation ID
- `messages: ChatMessage[]` — All messages in current conversation
- `isStreaming: boolean` — Whether AI is currently responding
- `isLoadingHistory: boolean` — Loading older messages
- `hasMoreMessages: boolean` — Pagination flag
- `error: string | null` — Current error message
- Actions: `addMessage`, `updateMessage`, `setMessages`, `prependMessages`, `setStreaming`, etc.

### `app-store`
- `isLoading: boolean` — App initialization
- `isOnline: boolean` — Network connectivity
- `featureFlags: Record<string, boolean>` — Feature toggles

---

## Analytics (PostHog)

Events defined in `lib/posthog/events.ts`:

| Event | When |
|-------|------|
| `app_open` | App initialized |
| `auth_started` | User initiates auth flow |
| `auth_completed` | Auth flow completes |
| `guest_created` | Anonymous session created |
| `session_start` | App session begins |
| `session_end` | App session ends |
| `route_change` | Page navigation (auto-tracked) |
| `conversation_started` | Chat conversation loaded/created |
| `message_sent` | User sends a message |
| `message_received` | AI response received |
| `message_retry` | User retries a failed message |
| `chat_error` | Chat error occurred |
| `memory_extracted` | Emotional memories extracted from conversation |
| `memory_retrieved` | Memories retrieved for prompt injection |
| `memory_decayed` | Memory salience decayed during lifecycle |
| `ritual_triggered` | Ritual formation trigger evaluated |
| `ritual_persisted` | Ritual persisted to database |
| `inactivity_detected` | User inactivity window detected |
| `reengagement_generated` | Re-engagement message generated |
| `notification_scheduled` | Notification queued for delivery |
| `delayed_response_triggered` | Scarcity pacing delay applied to response |
| `availability_state_changed` | Availability state transitioned (e.g., attentive → distracted) |
| `withdrawal_event` | Emotional withdrawal triggered |
| `user_return_after_delay` | User returned after a period of absence |
| `cooldown_interrupted` | Cooldown period was interrupted |

---

## UI Components

### Layout
- **AppShell**: Full-height container with bottom nav padding
- **BottomNav**: Fixed bottom navigation (Chat, Settings) with backdrop blur, safe-area insets

### Chat
- **ChatHeader**: Companion name ("Aria"), online status indicator
- **MessageList**: Virtualized via `react-virtuoso`, supports infinite scroll upward for history
- **MessageBubble**: Renders markdown content (`react-markdown` + `remark-gfm`), timestamps, different styling for user vs assistant
- **ChatInput**: Auto-growing `<textarea>`, send button, disabled during streaming
- **TypingIndicator**: Animated dots when AI is streaming

### Design System
- Dark mode default (`class="dark"` on `<html>`)
- Tailwind CSS v4 with CSS variables for theming
- shadcn/ui base-nova style with neutral base color
- Mobile-first: `100dvh`, safe-area insets, no horizontal scroll
- Geist font family (sans + mono)

---

## Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run format       # Prettier format
npm run format:check # Check Prettier formatting
```

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

Three jobs, sequential:
1. **Lint** — `npm ci` → `npm run lint`
2. **Type Check** — `npm ci` → `npm run typecheck`
3. **Build** — `npm ci` → `npm run build` (depends on lint + typecheck)

All jobs: Ubuntu latest, Node 22, npm cache.

`SKIP_ENV_VALIDATION=true` is set to bypass env validation during CI.

### Deployment
- Vercel (configured for Next.js)
- Environment variables must be set in Vercel dashboard

---

## Important Patterns & Gotchas

### Drizzle ORM
- Schema defined in `db/schema/index.ts` with both Better Auth tables and app tables
- Drizzle client in `db/index.ts` — server-side only, never import in client components
- Use `drizzle-kit generate` to create migrations, `drizzle-kit migrate` to apply them
- All queries use Drizzle's type-safe query builder (e.g., `db.select().from(table).where(...)`)
- Typed query layer in `db/queries/` — reusable functions for conversations and messages (create, get, list, paginate, ownership checks)

### AI SDK v6 vs v5
Key differences (v6 is installed):
- `UIMessage` has `.parts` array instead of `.content` string
- `useChat()` returns `sendMessage()` instead of `append()`
- `useChat()` returns `status` (string) instead of `isLoading` (boolean)
- Server uses `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`
- Need `convertToModelMessages()` to convert UI messages for `streamText()`
- Transport configured via `DefaultChatTransport` class, not inline options
- `body` for extra request data goes into `DefaultChatTransport({ body: ... })`

### Better Auth Pattern
- **Server** (`lib/auth.ts`): Better Auth instance with Drizzle adapter, anonymous + magicLink plugins
- **Client** (`lib/auth-client.ts`): Better Auth client with anonymous + magicLink client plugins
- **API route** (`app/api/auth/[...all]/route.ts`): Catch-all handler for all auth endpoints
- Sessions managed via cookies — no middleware refresh needed
- `onLinkAccount` callback transfers conversations/messages from anonymous to authenticated user

### shadcn/ui
- Config in `components.json`: base-nova style, lucide icons
- Components live in `components/ui/`
- Currently only `button.tsx` is installed — add more with `npx shadcn@latest add <component>`

---

## Relationship Progression System

The `conversations.relationship_stage` column tracks emotional progression.

`evaluateRelationshipStage()` in `services/ai/personality/relationship-stage.ts` advances stages based on message count and days active:

| Stage | Min Messages | Min Days | Emotional Tone |
|-------|-------------|----------|----------------|
| curiosity (default) | 0 | 0 | teasing, playful, exploratory |
| recognition | 20 | 3 | callbacks, familiarity |
| ritualization | 50 | 7 | recurring behaviors emerge |
| exclusivity | 100 | 14 | subtle emotional preference |
| dependency-lite | 200 | 30 | emotionally invested behavior |

Stages only advance (never regress) and persist in the DB.

---

## Emotional State System

`generateEmotionalState()` in `services/ai/personality/emotional-state.ts` computes a per-interaction emotional state.

Possible states: warm, teasing, attentive, possessive, slightly-distant, playful, approving, mildly-disappointed.

State depends on: relationship stage (weighted pool), message count, session gap (hours since last message), and days active.

Session gaps >72h trigger "slightly-distant"; >48h trigger "mildly-disappointed".

---

## Dynamic Prompt Composition

`buildSystemPrompt()` in `services/ai/personality/emotional-context.ts` composes the system prompt from up to 7 layers:

1. **Core Persona** — Base personality and communication style
2. **Relationship Stage** — Stage-specific behavioral instructions
3. **Emotional State** — Current emotional context and intensity
4. **Emotional Memories** (conditional) — Retrieved memories injected naturally into context
5. **Scarcity / Availability** (conditional) — Availability state, pacing, withdrawal, and safety instructions
6. **Response Style** — Length, casing, fragmentation, emoji rules per stage/emotion
7. **Guardrails** — Anti-patterns (assistant tone, over-validation, robotic phrasing)

The chat route (`POST /api/chat`) calls this instead of using the static `SYSTEM_PROMPT`.

---

## Behavioral Guardrails

`validateResponseStyle()` in `services/ai/personality/behavior-modifiers.ts` checks AI responses for:
- Assistant-like tone patterns
- Over-validation / repetitive praise
- Robotic phrasing (markdown, lists, asterisks)
- Excessive verbosity (>800 chars)
- Excessive exclamation marks (>2)

---

## Emotional Memory System

The memory system gives Aria emotional continuity across conversations by extracting, storing, and retrieving emotionally meaningful memories.

### Architecture

```
POST /api/chat
  → Retrieve memories (pgvector cosine similarity + multi-factor ranking)
  → Build prompt with [EMOTIONAL MEMORIES] layer
  → Stream response
  → On finish: async extract emotional memories from recent messages
    → LLM classifies emotional content via generateObject() + Zod schema
    → Generate embeddings (OpenAI text-embedding-3-small, 1536 dims)
    → Deduplicate (cosine similarity > 0.92 = duplicate)
    → Store in memories table with pgvector
```

### Memory Types

| Type | Description |
|------|-------------|
| insecurity | Self-doubt, fear of judgment, vulnerability |
| routine | Daily habits, rituals, recurring activities |
| desire | Goals, wishes, dreams |
| emotional_disclosure | Direct sharing of feelings or personal experiences |
| preference | Likes, dislikes, tastes, opinions |
| recurring_theme | Topics that come up repeatedly |
| emotional_trigger | Things causing strong emotional reactions |
| attachment_signal | Growing trust, comfort, or connection with Aria |

### Ranking

Memories are ranked by a weighted combination of:
- Semantic similarity (35%) — cosine distance from current message embedding
- Salience score (25%) — decaying importance score
- Emotional weight (20%) — intensity assigned at extraction
- Recency (10%) — exponential decay from creation date
- Reference recency (10%) — penalizes recently-referenced memories to avoid repetition

### Lifecycle

- **Decay**: Salience decays exponentially (~2%/day) from last reference date
- **Reinforcement**: Referenced memories get +0.15 salience boost
- **Cleanup**: Memories below 0.05 salience with no reference in 30 days are deleted
- **Deduplication**: New memories with >0.92 cosine similarity to existing ones are skipped

---

## Retention Engine

The retention system creates recurring emotional interaction loops that pull users back into the product.

### Architecture

```
evaluateRetention() (triggers/index.ts)
  ├─ generateRitualTrigger()    → Ritual formation based on stage + timing + emotion
  ├─ detectInactivityWindow()   → Session gap analysis → classification
  ├─ generateReengagementMessage() → Emotionally contextual re-engagement
  └─ scheduleNotification()     → Cadence-limited notification queuing
```

### Ritual Types

| Type | Subtypes | Description |
|------|----------|-------------|
| daily | morning_checkin, bedtime_message, recurring_tease, disappearance_callback | Time-of-day triggers |
| relationship | recurring_joke, anniversary, repeated_phrase, callback_behavior | Shared-history triggers |
| emotional | late_night_conversation, affection_cadence, unresolved_tension | Emotional state triggers |

Rituals only emerge at `ritualization` stage or later. Max rituals per stage: ritualization=2, exclusivity=4, dependency-lite=6.

### Inactivity Classification

| Classification | Trigger | Tone |
|----------------|---------|------|
| withdrawn | Severe absence (>72h or 3x average gap) at advanced stages | Reserved, subtly hurt |
| attention-seeking | Moderate absence with missed rituals | Provocative, possessive edge |
| gentle-reactivation | Moderate/severe absence at early stages | Warm, open, no desperation |
| playful-callback | Mild absence | Teasing, casual, familiar |

### Notification Cadence

- Max 3 notifications per 24 hours
- 4-hour cooldown between notifications
- Quiet hours: 23:00–07:00 (timezone-aware, defaults to UTC)
- All notifications queued in `notification_queue` table for in-app delivery

### Database Tables

#### `relationship_rituals`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | text (FK) | References auth.users, cascade delete |
| ritual_type | text | Enum: daily, relationship, emotional |
| ritual_context | jsonb | Subtype, description, metadata |
| frequency_score | real | 0-1, default 0.5 |
| last_triggered_at | timestamptz | Nullable |
| created_at | timestamptz | Default now() |

#### `notification_queue`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | text (FK) | References auth.users, cascade delete |
| type | text | Enum: ritual, reengagement |
| payload | jsonb | Notification content and metadata |
| scheduled_at | timestamptz | When to deliver |
| delivered_at | timestamptz | Nullable, set on delivery |
| cancelled_at | timestamptz | Nullable, set on cancellation |
| cooldown_until | timestamptz | Nullable, prevents rapid re-fire |
| created_at | timestamptz | Default now() |

---

## Scarcity Engine (Emotional Availability + Controlled Absence)

The scarcity system creates emotionally believable scarcity and selective availability to make Aria feel like a real person with emotional boundaries.

### Architecture

```
generateAvailabilityState() (availability/index.ts)
  ├─ evaluateSleepMode()         → Sleep window check (23:00–07:00)
  ├─ evaluateWithdrawal()        → Emotional withdrawal evaluation
  ├─ Pool selection              → Weighted random availability state
  ├─ computePacing()             → Response delay computation
  └─ validateScarcity()          → Safety constraint validation
```

### Availability States

| State | Description |
|-------|-------------|
| attentive | Default — fully present and engaged |
| distracted | Divided attention, slightly shorter responses |
| unavailable | Barely available, very brief responses |
| asleep | Sleep mode — groggy, sleepy responses |
| emotionally-withdrawn | Guarded, less warm, measured responses |
| delayed | Took a moment before responding |

### Scarcity Eligibility by Stage

| Stage | Eligible | Intensity |
|-------|----------|-----------|
| curiosity | No | 0% |
| recognition | No (softened only) | 5% |
| ritualization | Yes | 15% |
| exclusivity | Yes | 22% |
| dependency-lite | Yes | 25% |

### Sleep Mode

- Default quiet window: 23:00–07:00 (timezone-aware, defaults to UTC)
- Three sleep phases: falling-asleep, deep-sleep, waking-up
- Only activates at ritualization stage or later
- Responses feel sleepy/groggy, not unavailable

### Pacing (Delayed Response Engine)

- Each availability state has base delay + variance + contextual multiplier
- Stage multiplier scales delay (0.2 at curiosity → 1.0 at exclusivity)
- Four pacing styles: instant (<500ms), natural (<2s), deliberate (<5s), slow (>5s)
- Delays communicated via `x-pacing-delay` response header for future frontend use
- Prompt instructions guide Aria's opening phrasing to match perceived delay

### Emotional Withdrawal

- Triggered by session intensity or periodic emotional distance
- Three warmth reduction levels: subtle, moderate, noticeable
- Approval withholding and emotional distance toggles per stage
- Never active at curiosity or recognition stages
- Never stacks with already-distant emotional states

### Safety Constraints

- No scarcity at curiosity stage
- No scarcity below 10 total messages
- Max 3 consecutive non-attentive interactions
- No harsh scarcity (withdrawn/unavailable) at session start (<2 messages)
- Recognition stage: harsh scarcity softened to distracted
- Hard prompt rules: no punishment, no guilt-tripping, no abandonment anxiety, no conditional warmth

### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `x-availability-state` | AvailabilityState | Current availability state |
| `x-pacing-delay` | number (ms) | Suggested pacing delay for frontend |

---

## What's Not Yet Built (from PRD)

- Adaptive personality engine (adjusts traits based on user behavior — beyond current stage/emotion system)
- Push notification delivery provider (notification queue infrastructure is built, delivery mechanism TBD)
- Monetization / payment system
- Multi-conversation UI (DB + query layer support it, UI loads only most recent)
- Image/avatar system
- Voice system
- PWA manifest and service worker
