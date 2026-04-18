# LOCKIN

Premium multi-room study collaboration platform for engineering exam prep. Users create custom study spaces, manage subject libraries, invite friends, and track group progress with isolated analytics.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn-style reusable UI (primitives, card, button, input, progress, badge, skeleton)
- Lucide React icons
- Supabase (Auth, PostgreSQL with RLS, Realtime Presence, Cloud Storage)
- pnpm package manager

## Quick Start

### Install Dependencies

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run `supabase/schema.sql` to create tables, indexes, RLS policies, and helper functions
3. Verify storage bucket `materials` exists in Storage settings

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Core Architecture

### Multi-Room Model

- **Users** join multiple rooms
- **Rooms** have owner + admin + members
- **Subjects** are per-room (Maths, DSA, Aptitude, etc.)
- **Study logs**, **materials**, **leaderboards** are room-isolated
- **Invite codes** enable easy sharing and onboarding

### Key Routes

| Route | Purpose |
|-------|---------|
| `/sign-in`, `/sign-up` | Auth pages |
| `/dashboard` | Redirect to primary room or creation |
| `/rooms/create` | Create new study room |
| `/rooms/join` | Join by invite code |
| `/rooms/[slug]` | Room dashboard (main workspace) |
| `/rooms/[slug]/subjects` | Manage room subjects |
| `/rooms/[slug]/invite` | Share room & invite friends |
| `/rooms/[slug]/settings` | Room info & settings hub |

### Dashboard Features

- **Countdown Timer**: Room exam date or default 30-day target
- **Subject Navigator**: Room-defined subjects with live filtering
- **Live Study Tracker**: Start/pause/resume/stop sessions, log session goals/notes
- **Vault**: Drag-drop file uploads, subject-scoped downloads, pinning
- **Analytics**: Daily study chart, subject distribution pie chart, weekly target progress
- **Leaderboard**: Room-scoped weekly rankings by study minutes
- **Room Switcher**: Dropdown to switch between joined rooms in navbar

## Available Scripts

```bash
pnpm dev           # Start development server (http://localhost:3000)
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint on code
pnpm typecheck     # Run TypeScript compiler for type validation
```

## Database Schema

See [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) for full schema reference including:
- Tables: `profiles`, `rooms`, `room_members`, `room_invites`, `subjects`, `study_logs`, `materials`
- Views: `room_leaderboard_weekly` (room-scoped with RLS)
- Functions: `is_room_member()`, `has_room_role()`, `join_room_by_code()`
- RLS Policies: Role-based access control per room

## Security

- **Row-Level Security (RLS)**: All tables protected; membership enforced at Postgres layer
- **Role-Based Permissions**: Owner/admin/member roles with specific permissions
- **API Guards**: Endpoint-level role checks before mutations
- **Storage Policies**: Room ID in object paths enforces access control
- **Auth**: Supabase JWT-based sessions, no hardcoded secrets in client

## File Upload

- Max file size: **25 MB**
- Supported types: PDF, DOCX, PPTX, XLSX, JPG, PNG
- Storage quota: **1.5 GB** per workspace
- Path structure: `materials/{room_id}/{user_id}/{timestamp}-{filename}`
- Access: Room members only; storage policies enforce access

## Project Structure

```
app/                  # Next.js routes
├── api/              # API endpoints (rooms, joins, subjects, materials)
├── dashboard/        # Legacy redirect to rooms
├── rooms/            # Room pages (create, join, [slug], invite, subjects, settings)
├── sign-in/          # Auth pages
├── sign-up/
└── layout.tsx

components/
├── dashboard/        # UI components (navbar, tracker, vault, leaderboard, etc.)
├── rooms/            # Room-specific forms & panels
├── auth/             # Auth forms
├── ui/               # Primitives (button, card, input, etc.)

lib/                  # Utilities & schemas
├── constants.ts      # Upload limits
├── dashboard-data.ts # Room data fetcher
├── validation.ts     # Zod schemas
├── utils.ts

types/               # TypeScript interfaces
├── app.ts           # Core types (Room, Subject, RoomMember, etc.)
└── dashboard.ts     # Dashboard data types

utils/supabase/      # Supabase clients
├── client.ts        # Browser client
├── server.ts        # Server-side client
└── middleware.ts    # Auth middleware

supabase/
└── schema.sql       # Database schema, RLS, functions

public/              # Assets, manifest, service worker
hooks/               # React hooks (useCountdown, useStopwatch, usePresence, etc.)
```

## Migration from Single-Room

If upgrading from the old global-scope app:

1. Run `supabase/schema.sql` to create new multi-room schema
2. Your old profile data migrates automatically via auth trigger
3. Create a new room to start using the app
4. Follow [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) for detailed walkthrough

## Performance

- **Indexes**: On `room_id`, `user_id`, `created_at`, composite `room_members` keys
- **Leaderboard View**: Uses `security_invoker = true` for per-room RLS (Postgres 15+)
- **Instant Navigation**: Next.js 16 `unstable_instant` on auth pages for optimized pre-fetch
- **No N+1 Queries**: Dashboard uses parallel Promise.all() for study logs, materials, leaderboard

## Environment Variables

```bash
# Supabase (from Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Deployment

### Vercel (Recommended)

1. Push repo to GitHub
2. Import project into Vercel
3. Set environment variables from `.env.local`
4. Deploy

### Other Platforms

- Node.js 18+
- `pnpm install && pnpm build && pnpm start`
- Set same env vars

## Development Tips

- Use `pnpm dev` with Next.js DevTools for instant reloads
- ESLint runs on file save (configure in IDE)
- TypeScript: `pnpm typecheck` before pushing
- Hot module reloading works for components, but pages may need manual refresh
- Open [http://localhost:3000/api/rooms](http://localhost:3000/api/rooms) when signed in to see your room list

## Contributing

1. Create a feature branch
2. Update types in `types/` as needed
3. Add/modify tests
4. Run `pnpm lint && pnpm typecheck` before submitting PR
5. Follow existing code patterns (shadcn UI, Zod validation, RLS-first design)

## License

MIT

## Docs & Resources

- [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) — Detailed migration & architecture docs
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
