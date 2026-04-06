# LBMAA Website

LBMAA (Los Banos Martial Arts Academy) web application with:

- Public marketing site
- Invite-based magic-link authentication
- Family portal
- Admin portal
- Supabase-backed data model, messaging, and file attachments

## Tech Stack

- Frontend: React + Vite
- UI: Radix primitives + Tailwind utility classes
- Backend services: Supabase (Auth, PostgREST, Realtime, Storage)
- Database: PostgreSQL via Supabase SQL migrations

## What This App Does

- Public pages: home, about, programs, instructors, reviews, FAQ, contact
- Invite-only login: checks account existence before sending magic links
- Onboarding: first-time family users complete profile + family/guardian setup
- Family portal:
  - Home dashboard with activity summary
  - Announcements + comments
  - Parent blog + comments
  - Messaging (global + role-constrained DMs)
  - Profile/family/student management
- Admin portal:
  - Communication management (announcements, blog, messaging)
  - Family/student lifecycle management
  - Invite family accounts
  - Enrollment lead review support (from public contact form)

## Project Structure

- `src/App.tsx`: route entry, auth gates, role routing
- `src/components/public/*`: public website pages
- `src/components/dashboard/*`: family portal tabs
- `src/components/admin/*`: admin portal tabs
- `src/hooks/useAuth.ts`: auth/session/bootstrap logic + access state
- `src/hooks/useProfile.ts`: family profile aggregate data hook
- `src/lib/supabase/client.ts`: Supabase client + timeout RPC wrappers
- `src/lib/supabase/queries.ts`: read/query API wrappers
- `src/lib/supabase/mutations.ts`: write/mutation API wrappers
- `src/lib/supabase/realtime.ts`: realtime subscriptions
- `src/lib/supabase/storage.ts`: file upload/download helpers
- `supabase/migrations/*`: schema, RLS, policy, and RPC definitions

## Routes

- `/`: public website
- `/dashboard`: protected dashboard (family users; admin can also be routed here)
- `/admin`: protected admin-only dashboard
- `/onboarding`: first-login setup for family users without a family record

## Local Setup

1. Install dependencies:
   - `npm install`
2. Add environment variables in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run development server:
   - `npm run dev`

## Scripts

- `npm run dev`: start Vite development server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## Database and Supabase

Core database schema and policies are managed through migrations in `supabase/migrations`.

Notable backend features:

- Invite-only account verification via `check_email_has_account`
- Public enrollment lead intake via `submit_enrollment_lead`
- Role-safe direct-message conversation creation via `create_or_get_dm_conversation`
- Extensive RLS policy coverage for portal data and storage attachments

## Documentation

Comprehensive docs are in `docs/`:

- `docs/README.md`: documentation index
- `docs/ARCHITECTURE.md`: architecture overview
- `docs/DESIGN.md`: product/UX and flow design
- `docs/API.md`: frontend data API and RPC docs
- `docs/DATABASE.md`: schema, policies, and migration guide

## Notes

- The repository currently contains some legacy prototype files (`src/App.jsx`, `src/main.jsx`, `src/lib/supabaseClient.js`) alongside active TypeScript codepaths (`src/App.tsx`, `src/main.tsx`).
- The active app entry is `src/main.tsx`.
