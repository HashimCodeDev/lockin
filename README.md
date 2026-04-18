# LOCKIN

Premium cyber-military study command center for engineering students preparing for April 2026 B.Tech S4 exams.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn-style reusable UI primitives
- Lucide React icons
- Supabase (Auth, PostgreSQL, Realtime Presence, Storage)
- Vercel-ready deployment
- pnpm package manager

## Install Commands (pnpm only)

```bash
pnpm install
pnpm dev
```

If you need to re-add dependencies manually:

```bash
pnpm add @supabase/ssr @supabase/supabase-js class-variance-authority clsx date-fns framer-motion lucide-react recharts sonner tailwind-merge zod
```

## Environment

Copy `.env.example` into `.env.local` and set values.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Verify storage bucket `materials` exists.
4. Enable email authentication in Supabase Auth.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

## Phase Delivery Map

### Phase 1

- Folder architecture: `app`, `components`, `lib`, `hooks`, `types`, `supabase`, `public`
- Global cyber-military design tokens in `app/globals.css`
- Main app shell with sticky navbar and responsive subject navigator

### Phase 2

- Live stopwatch tracker with start/pause/resume/stop
- Weekly leaderboard with rank titles
- Sticky exam countdown with urgency mode
- Analytics charts and progress cards

### Phase 3

- Supabase SQL schema + RLS + leaderboard view + XP RPC
- Auth pages (`/sign-in`, `/sign-up`)
- Protected `/dashboard` route
- Realtime active users via Supabase Presence

### Phase 4

- The Vault upload system with drag/drop
- Type + size validation and low-storage controls
- Duplicate checks + upload API rate limiting
- Search and subject/type filtering

### Phase 5

- UI polish and mobile bottom navigation
- PWA manifest + service worker registration
- SEO basics (`robots`, `sitemap`)
- Deployment-ready configuration for Vercel

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project into Vercel.
3. Set environment variables from `.env.local`.
4. Deploy with default Next.js build command.

## Notes

- Storage policies enforce ownership for delete access.
- Uploads are limited to 25MB and approved file types only.
- For best mobile performance, keep chart datasets bounded to recent windows.
