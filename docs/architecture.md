# Architecture

## Overview

Aphrodite Spell is a mobile-first Next.js 16 application using the App Router pattern. It uses PostgreSQL (via Drizzle ORM) for the database and Better Auth for authentication. State management uses Zustand with PostHog for analytics.

## Data Flow

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

- Provider abstraction via `services/ai/providers/` — swap models without touching UI
- Messages stream via `toUIMessageStreamResponse()` using AI SDK v6 UIMessage protocol
- Conversations + messages persisted to PostgreSQL via API routes with application-level auth checks

## Key Patterns

### Better Auth

- **Server** (`lib/auth.ts`): Better Auth instance with Drizzle adapter, anonymous + magicLink plugins
- **Client** (`lib/auth-client.ts`): Better Auth client with anonymous + magicLink client plugins
- **API route** (`app/api/auth/[...all]/route.ts`): Catch-all handler for all auth endpoints
- Sessions managed via cookies — no middleware refresh needed
- `onLinkAccount` callback transfers conversations/messages from anonymous to authenticated user

### Authentication Flow

1. First visit → anonymous Better Auth session created automatically
2. User can optionally link email via magic link (`/auth`)
3. Auth callback (`/auth/callback`) redirects after Better Auth handles verification internally
4. Auth state synced to Zustand store via `authClient.getSession()`

### Server/Client Boundary

- Drizzle + pg runs server-side only in API routes (`/api/conversations`, `/api/messages`, `/api/chat`)
- Client components use `fetch()` to call API endpoints via `services/chat.ts`
- Never import `db/` or `lib/auth.ts` in client components

### State Management

Zustand stores follow a flat, minimal pattern:

- `auth-store`: User, session, guest status (Better Auth types)
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
- User identification linked to Better Auth
- Typed event helpers in `lib/posthog/events.ts`
- Chat events: `conversation_started`, `message_sent`, `message_received`, `message_retry`, `chat_error`

### Database Schema

Defined in `db/schema/index.ts` using Drizzle ORM:

- Better Auth tables: `user`, `session`, `account`, `verification`
- `profiles`: Per-user profile data, auto-created via database hooks
- `app_sessions`: App session tracking for engagement analytics
- `conversations`: Per-user conversation threads with `relationship_stage` tracking
- `messages`: Individual messages with `sender_type` (user/assistant), content, metadata
- All tables have application-level auth checks in API routes

## Future Considerations

- Sentry for error monitoring
- WebSocket for live typing indicators
- Multi-conversation support (DB schema already supports it)
- PWA manifest and service worker
- Message reactions and emotional tagging
