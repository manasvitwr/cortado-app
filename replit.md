# Tutord

A mobile-first learning library for saving, reviewing, and organizing YouTube tutorials.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `YOUTUBE_API_KEY` — richer video metadata and first-25 playlist imports

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tutord` — React web app and branded Clerk screens
- `artifacts/api-server/src/routes/tutord.ts` — authenticated product API
- `lib/api-spec/openapi.yaml` — API contract and generated hook source
- `lib/db/src/schema/tutord.ts` — PostgreSQL schema

## Architecture decisions

- Replit-managed Clerk and PostgreSQL replace the prompt's Supabase dependency so auth, data, rollback, and publishing use the platform's supported production path.
- Video metadata uses oEmbed by default; playlist expansion and richer metadata activate only when `YOUTUBE_API_KEY` exists.
- YouTube media is never downloaded or processed locally.

## Product

Users can sign in, save YouTube videos with captions, notes, summaries, ratings and watch status, import or create lists, and browse dashboard, detail, discovery, and profile views.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API codegen after every change to `lib/api-spec/openapi.yaml`.
- Playlist URLs work without an API key, but only as list shells.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
