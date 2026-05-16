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
| Backend | Supabase (Postgres, Auth, Realtime) | supabase-js ^2.105.4, ssr ^0.10.3 |
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
│   │   └── chat/
│   │       └── route.ts          # POST /api/chat — streaming AI endpoint
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
│   ├── use-chat.ts               # useChatController — orchestrates AI SDK useChat + Supabase persistence + analytics
│   └── use-scroll-anchor.ts      # Auto-scroll to bottom on new messages
│
├── lib/
│   ├── companion.ts              # Companion config (name: "Aria", tagline, avatar placeholder)
│   ├── env.ts                    # t3-oss env validation (Supabase, PostHog, AI keys)
│   ├── logger.ts                 # Structured console logger (debug/info/warn/error)
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   ├── posthog/
│   │   ├── events.ts             # Analytics event constants + typed track helpers
│   │   └── provider.tsx          # PostHog init, pageview tracking, user identification
│   └── supabase/
│       ├── client.ts             # Browser client (singleton, typed with Database)
│       ├── server.ts             # Server client (per-request, cookie-based)
│       └── middleware.ts         # Middleware client (refreshes auth tokens)
│
├── services/
│   ├── auth.ts                   # Auth service: signIn, signOut, magicLink, linkEmail, getUser
│   ├── chat.ts                   # Chat CRUD: getOrCreateConversation, loadMessages, saveMessage, updateMessage
│   └── ai/
│       ├── index.ts              # AI orchestration: getModel(), SYSTEM_PROMPT re-export
│       ├── prompts/
│       │   └── system.ts         # Aria's system prompt (personality, communication style)
│       └── providers/
│           ├── index.ts          # Provider factory: getProvider() — Anthropic > OpenAI fallback
│           ├── anthropic.ts      # Anthropic adapter (claude-sonnet-4-20250514)
│           └── openai.ts         # OpenAI adapter (gpt-4o)
│
├── store/
│   ├── app-store.ts              # App state: isLoading, isOnline, featureFlags
│   ├── auth-store.ts             # Auth state: user, session, isGuest, isLoading
│   └── chat-store.ts             # Chat state: messages, conversationId, streaming, pagination, error
│
├── types/
│   └── database.ts               # Supabase Database type with all tables (Row/Insert/Update/Relationships)
│
├── supabase/
│   └── migrations/
│       ├── 00001_create_profiles.sql     # profiles table + RLS + auto-create trigger
│       ├── 00002_create_sessions.sql     # sessions table + RLS + indexes
│       ├── 00003_create_conversations.sql # conversations table + RLS + indexes
│       └── 00004_create_messages.sql     # messages table + RLS (subquery join) + indexes
│
├── docs/
│   └── architecture.md           # Architecture overview and data flow diagrams
│
├── .github/
│   └── workflows/
│       └── ci.yml                # CI: lint → typecheck → build (Node 22, npm ci)
│
├── middleware.ts                  # Next.js middleware: refreshes Supabase session on every request
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
Browser → Next.js Middleware (session refresh) → App Router → React Components
                                                      ↓
                                               Supabase (Auth + DB)
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
                                                   Supabase (persist on finish)
```

### Key Architectural Decisions

1. **AI SDK v6** (not v5): Uses `UIMessage` with `parts` array, `sendMessage()` instead of `append()`, `status` instead of `isLoading`, `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`, `convertToModelMessages()` for model message conversion
2. **Dual state management**: AI SDK manages streaming state internally; Zustand store mirrors messages for UI rendering and persistence
3. **Provider abstraction**: `services/ai/providers/` — swap AI models without touching UI code
4. **Supabase typed client**: `@supabase/supabase-js` v2.105+ requires `Relationships` field on all table type definitions (GenericTable constraint)
5. **RLS everywhere**: All tables have row-level security. Messages use subquery joins to verify conversation ownership
6. **Anonymous-first auth**: Auto-creates anonymous Supabase session on first visit; users can upgrade to email via magic link

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

Auto-created via trigger `on_auth_user_created` when a new auth user is inserted.

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
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

Indexes: `user_id`, `updated_at DESC`

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| conversation_id | uuid (FK) | References conversations, cascade delete |
| sender_type | text | Enum: 'user' or 'assistant' |
| content | text | Default '' |
| metadata | jsonb | Nullable |
| created_at | timestamptz | Default now() |

Indexes: `conversation_id`, `(conversation_id, created_at ASC)`

### RLS Policies

All tables have `SELECT`, `INSERT`, `UPDATE` policies scoped to `auth.uid()`.

- `profiles`, `sessions`, `conversations`: Direct `auth.uid() = user_id` check
- `messages`: Uses subquery join — `EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid())`

---

## Environment Variables

| Variable | Required | Server/Client | Description |
|----------|----------|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server | Supabase service role key |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Client | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Client | PostHog instance URL |
| `ANTHROPIC_API_KEY` | Yes* | Server | Anthropic API key (*required if using Anthropic provider) |
| `OPENAI_API_KEY` | Yes* | Server | OpenAI API key (*required if Anthropic unavailable) |
| `SKIP_ENV_VALIDATION` | No | Both | Set to "true" to skip env validation (used in CI) |

Env validation uses `@t3-oss/env-nextjs` in `lib/env.ts`. All vars are optional in schema but the app won't function without Supabase vars and at least one AI provider key.

---

## Authentication Flow

1. **First visit** → Anonymous Supabase session created automatically via `signInAnonymously()`
2. **Guest user** → Can use chat immediately, data persisted under anonymous user ID
3. **Email upgrade** → `/auth` page: links email via magic link (preserves existing data)
4. **Auth callback** → `/auth/callback` exchanges code for session via `exchangeCodeForSession()`
5. **Session refresh** → Middleware refreshes auth token on every request
6. **State sync** → `AuthListener` in `providers.tsx` syncs Supabase auth state to Zustand

---

## Chat System

### How It Works

1. **Initialization**: `useChatController` loads or creates a conversation via `getOrCreateConversation(userId)`, fetches message history
2. **Sending**: User types message → optimistic add to store → persist to Supabase → trigger AI SDK `sendMessage()`
3. **Streaming**: AI SDK calls `POST /api/chat` → `streamText()` with provider model → `toUIMessageStreamResponse()` → SSE to client
4. **Receiving**: Streaming chunks update a placeholder assistant message in the store; on finish, the complete response is persisted to Supabase
5. **Retry**: On error, removes failed assistant message, re-sends last user message

### API Route (`POST /api/chat`)

1. Authenticates via Supabase server client (`getUser()`)
2. Verifies conversation ownership via RLS count query
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
- `user: User | null` — Current Supabase user
- `session: Session | null` — Current Supabase session
- `isGuest: boolean` — Derived from `user.is_anonymous`
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

### Supabase Type System
- `types/database.ts` must include `Relationships` field on every table (required by `@supabase/supabase-js` v2.105+ / postgrest-js v2.105+)
- Without `Relationships`, all `.from()` calls resolve to `never` type
- Supabase clients are typed with `Database` generic: `createBrowserClient<Database>()`, `createServerClient<Database>()`

### AI SDK v6 vs v5
Key differences (v6 is installed):
- `UIMessage` has `.parts` array instead of `.content` string
- `useChat()` returns `sendMessage()` instead of `append()`
- `useChat()` returns `status` (string) instead of `isLoading` (boolean)
- Server uses `toUIMessageStreamResponse()` instead of `toDataStreamResponse()`
- Need `convertToModelMessages()` to convert UI messages for `streamText()`
- Transport configured via `DefaultChatTransport` class, not inline options
- `body` for extra request data goes into `DefaultChatTransport({ body: ... })`

### Supabase SSR Pattern
Three client abstractions:
1. **Browser** (`lib/supabase/client.ts`): Singleton, for client components
2. **Server** (`lib/supabase/server.ts`): Per-request, cookie-based, for server components + route handlers
3. **Middleware** (`lib/supabase/middleware.ts`): Refreshes auth tokens on every request

### shadcn/ui
- Config in `components.json`: base-nova style, lucide icons
- Components live in `components/ui/`
- Currently only `button.tsx` is installed — add more with `npx shadcn@latest add <component>`

---

## Relationship Progression System

The `conversations.relationship_stage` column tracks emotional progression:

1. **Curiosity** (default) — Playful, teasing, seductive
2. **Recognition** — References prior conversations, emotional realism
3. **Ritualization** — Recurring interactions, habit formation
4. **Emotional Exclusivity** — Implies emotional preference
5. **Dependency** — Deep emotional investment

Currently only the DB column exists; stage progression logic is not yet implemented.

---

## What's Not Yet Built (from PRD)

- Emotional volatility system (variable AI mood)
- Adaptive personality engine (adjusts traits based on user behavior)
- Memory system (emotional recall across conversations)
- Scarcity systems (sleep mode, cooldowns, "busy" states)
- Push notifications / scheduled messages
- Monetization / payment system
- Multi-conversation UI (DB supports it, UI loads only most recent)
- Image/avatar system
- Voice system
- PWA manifest and service worker
