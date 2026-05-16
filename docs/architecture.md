# Architecture

## Overview

Aphrodite Spell is a mobile-first Next.js 15 application using the App Router pattern. It connects to Supabase for auth, database, and realtime features. State management uses Zustand with PostHog for analytics.

## Data Flow

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

- Provider abstraction via `services/ai/providers/` — swap models without touching UI
- Messages stream via `toUIMessageStreamResponse()` using AI SDK v6 UIMessage protocol
- Conversations + messages persisted to Supabase with RLS policies

## Key Patterns

### Supabase SSR

Three client abstractions handle different execution contexts:

- **Browser client** (`lib/supabase/client.ts`): Singleton for client components
- **Server client** (`lib/supabase/server.ts`): Per-request for server components and route handlers
- **Middleware client** (`lib/supabase/middleware.ts`): Refreshes auth tokens on every request

### Authentication Flow

1. First visit → anonymous Supabase session created automatically
2. User can optionally link email via magic link (`/auth`)
3. Auth callback (`/auth/callback`) exchanges code for session
4. Auth state synced to Zustand store via `onAuthStateChange` listener

### State Management

Zustand stores follow a flat, minimal pattern:

- `auth-store`: User, session, guest status
- `chat-store`: Messages, conversation state, streaming status, pagination
- `app-store`: Loading states, connectivity, feature flags

### Mobile-First Design

- `100dvh` viewport units for dynamic viewport handling
- `env(safe-area-inset-*)` for notch/home indicator spacing
- Fixed bottom navigation with backdrop blur
- Dark mode as default (class-based via `dark` on `<html>`)
- `viewport-fit=cover` and `user-scalable=false` for native feel

### Error Handling

- Route-level error boundary (`app/error.tsx`)
- Global error boundary (`app/global-error.tsx`) with inline styles (no CSS dependencies)
- Structured logging via `lib/logger.ts`

### Analytics

PostHog integrated via `@posthog/next`:

- Automatic pageview tracking with URL capture
- User identification linked to Supabase auth
- Typed event helpers in `lib/posthog/events.ts`
- Chat events: `conversation_started`, `message_sent`, `message_received`, `message_retry`, `chat_error`

### Database Schema

- `conversations`: Per-user conversation threads with `relationship_stage` tracking
- `messages`: Individual messages with `sender_type` (user/assistant), content, metadata
- Both tables have RLS policies scoped to `auth.uid()`

## Future Considerations

- Sentry for error monitoring
- Supabase Realtime for live typing indicators
- Multi-conversation support (DB schema already supports it)
- PWA manifest and service worker
- Message reactions and emotional tagging
