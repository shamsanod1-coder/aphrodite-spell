# Aphrodite Spell

Emotionally adaptive AI companion — mobile-first, text-first, retention-focused.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **State**: Zustand
- **Analytics**: PostHog
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Supabase project (for auth & database)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog instance URL |
| `OPENAI_API_KEY` | No | OpenAI API key (future) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (future) |

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
├── lib/
│   ├── supabase/         # Supabase client abstractions
│   ├── posthog/          # Analytics provider & events
│   ├── env.ts            # Environment variable validation
│   ├── logger.ts         # Logging abstraction
│   └── utils.ts          # Shared utilities
├── services/             # Business logic services
├── store/                # Zustand state stores
├── types/                # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database migrations
└── docs/
    └── architecture.md   # Architecture documentation
```

## Authentication

- **Guest access**: Anonymous Supabase session created on first visit
- **Magic link**: Email-based passwordless authentication
- **Upgrade flow**: Guests can link email to preserve data

## Database

Migrations are in `supabase/migrations/`. Apply them via the Supabase dashboard or CLI.

- `profiles` — User profile data, linked to `auth.users`
- `sessions` — App session tracking for engagement analytics

## Deployment

Deploy to Vercel:

```bash
vercel
```

Ensure all required environment variables are set in the Vercel dashboard.
