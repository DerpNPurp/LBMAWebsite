# Frontend Module Guide

## Entry and Routing

- Entry point: `main.tsx`
- App routing and auth guards: `App.tsx`

## Main Component Areas

- `components/public/*`: public marketing pages
- `components/dashboard/*`: family dashboard features
- `components/admin/*`: admin dashboard features
- `components/ui/*`: shared UI primitives/components

## Hooks

- `hooks/useAuth.ts`
  - Session bootstrap, profile loading, access-state computation
- `hooks/useProfile.ts`
  - Family profile aggregate loading and update helpers

## Data Layer

- `lib/supabase/client.ts`: Supabase client and timeout-based RPC wrappers
- `lib/supabase/queries.ts`: read operations
- `lib/supabase/mutations.ts`: write operations
- `lib/supabase/realtime.ts`: realtime subscriptions
- `lib/supabase/storage.ts`: file upload/download helpers

## Notes

- Active path is TypeScript (`*.ts`, `*.tsx`).
- Legacy prototype files (`App.jsx`, `main.jsx`, `lib/supabaseClient.js`) are still present but not part of the active app entry.
