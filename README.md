# Aphrodite Spell

Emotionally adaptive AI companion — mobile-first, text-first, retention-focused.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: PostgreSQL 16 + pgvector (via Docker Compose, Drizzle ORM)
- **Auth**: Better Auth (anonymous + magic link)
- **State**: Zustand
- **Analytics**: PostHog
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Docker (for local PostgreSQL)

### Setup

```bash
# Start PostgreSQL database
docker compose up -d

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx drizzle-kit migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret key for Better Auth (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance URL |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key (*or OpenAI key required) |
| `OPENAI_API_KEY` | Yes* | OpenAI API key (*fallback if no Anthropic key) |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

## Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── auth/             # Authentication (magic link)
│   ├── chat/             # Chat interface
│   ├── settings/         # User settings
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing (redirects to /chat)
│   ├── error.tsx         # Route error boundary
│   └── global-error.tsx  # Global error boundary
├── components/
│   ├── layout/           # App shell, bottom nav
│   ├── providers.tsx     # Client providers wrapper
│   └── ui/               # shadcn/ui components
├── db/
│   ├── schema/           # Drizzle table definitions
│   └── index.ts          # Drizzle client instance
├── lib/
│   ├── auth.ts           # Better Auth server instance
│   ├── auth-client.ts    # Better Auth client
│   ├── posthog/          # Analytics provider & events
│   ├── env.ts            # Environment variable validation
│   ├── logger.ts         # Logging abstraction
│   └── utils.ts          # Shared utilities
├── services/             # Business logic services
├── store/                # Zustand state stores
└── docs/
    └── architecture.md   # Architecture documentation
```

## Authentication

- **Guest access**: Anonymous Better Auth session created on first visit
- **Magic link**: Email-based passwordless authentication
- **Upgrade flow**: Guests can link email to preserve data (conversations transferred automatically)

## Database

Schema defined in `db/schema/index.ts` using Drizzle ORM. Migrations managed via Drizzle Kit.

```bash
# Generate migration after schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

Tables: `profiles`, `app_sessions`, `conversations`, `messages` (plus Better Auth tables).

## Deployment

Deploy to Vercel:

```bash
vercel
```

Ensure all required environment variables are set in the Vercel dashboard.
