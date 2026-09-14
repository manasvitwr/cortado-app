# Cortado Codebase Guide

Cortado is a YouTube learning library. Users can save tutorials and Shorts, write notes and summaries, rate videos, track watch status, organize videos into playlists, edit their profile, and discover public community recommendations.

The project is a pnpm monorepo with a React/Vite frontend and an Express API backed by PostgreSQL.

## Repository map

### Main application

- `artifacts/tutord/`
  - React/Vite web application.
  - The artifact keeps the historical `tutord` directory name for Replit routing compatibility, but the product branding is Cortado.
  - Public landing page: `src/pages/landing.tsx`
  - Application routes and Clerk wiring: `src/App.tsx`
  - Authenticated layout/navigation: `src/components/layout.tsx`
  - Shared styles and Cortado theme: `src/index.css`
  - Logo asset: `public/cortado-logo.png`

### Frontend pages

- `src/pages/home.tsx` — dashboard, watchlist, recent saves, community discovery preview.
- `src/pages/explore.tsx` — personalized Cortado Trending and Curated Lists.
- `src/pages/add.tsx` — save a video or import a YouTube playlist.
- `src/pages/lists.tsx` — create and manage Cortado playlists.
- `src/pages/entry-detail.tsx` — edit notes, summaries, ratings, status, and visibility.
- `src/pages/profile.tsx` — profile, avatar/banner uploads, interests, and Top 4 tutorials.
- `src/pages/onboarding.tsx` — optional name, bio, interests, and username setup.
- `src/pages/landing.tsx` — public marketing page.

### Backend

- `artifacts/api-server/`
  - Express API server.
  - Entry point: `src/index.ts`
  - Express setup and middleware: `src/app.ts`
  - Main Cortado routes: `src/routes/tutord.ts`
  - Storage routes: `src/routes/storage.ts`
  - YouTube metadata helpers: `src/lib/youtube.ts`
  - Personalized discovery ranking: `src/lib/discoveryRanking.ts`
  - Discovery ranking tests: `src/lib/discoveryRanking.test.ts`
  - Profile compatibility tests: `src/lib/profileCompatibility.test.ts`
  - Clerk proxy middleware: `src/middlewares/clerkProxyMiddleware.ts`
  - App Storage helpers: `src/lib/objectStorage.ts` and `src/lib/objectAcl.ts`

### Shared libraries

- `lib/db/`
  - Drizzle database connection and schema.
  - Cortado tables: `src/schema/tutord.ts`
- `lib/api-spec/`
  - Source-of-truth OpenAPI contract: `openapi.yaml`
  - Code generation configuration and script.
- `lib/api-zod/`
  - Generated server-side request/response schemas.
- `lib/api-client-react/`
  - Generated React Query hooks and API client used by the frontend.
- `attached_assets/`
  - User-provided reference images and brand assets.

## Important data model

The Cortado schema is in `lib/db/src/schema/tutord.ts`.

- `profiles` — Clerk user ID, username, display name, bio, interests, profile images, and Top 4 entries.
- `videos` — normalized YouTube metadata shared across users.
- `entries` — a user’s saved video, notes, rating, status, and visibility.
- `playlists` — Cortado lists or imported YouTube playlists.
- `playlist_videos` — ordered videos inside a playlist.

Private entries are not eligible for public discovery. Discovery uses public Cortado saves and public playlists only.

## Authentication

Cortado uses Replit-managed Clerk:

- Frontend Clerk configuration is in `artifacts/tutord/src/App.tsx`.
- Backend Clerk middleware is in `artifacts/api-server/src/app.ts`.
- Protected API routes derive the user ID from Clerk session claims.
- The API provisions a profile on first authenticated access.
- New username updates remain strict and unique.
- Profile response validation is intentionally compatible with legacy stored usernames so older users can still sign in and load their profiles.

Do not commit Clerk keys, session secrets, database URLs, or object-storage credentials. Configure them through Replit Secrets.

## API routes

The main API is mounted under `/api`.

- `GET /api/healthz` — health check.
- `GET /api/dashboard` — authenticated dashboard data.
- `GET /api/entries` — authenticated saved entries.
- `POST /api/entries` — save a YouTube video.
- `GET /api/entries/:entryId` — get one entry.
- `PATCH /api/entries/:entryId` — update notes, rating, status, or visibility.
- `DELETE /api/entries/:entryId` — remove a saved entry.
- `GET /api/playlists` — authenticated user lists.
- `POST /api/playlists` — create a Cortado list.
- `POST /api/playlists/import` — import a YouTube playlist.
- `POST /api/playlists/:playlistId/videos` — add a video to a list.
- `DELETE /api/playlists/:playlistId/videos/:videoId` — remove a video from a list.
- `GET /api/profile` — authenticated profile and library summary.
- `PATCH /api/profile` — update profile details and interests.
- `GET /api/explore/trending` — authenticated personalized Cortado discovery.
- `POST /api/storage/upload-url` — request a profile-image upload URL.

The OpenAPI contract is the source of truth. If an API contract changes:

1. Update `lib/api-spec/openapi.yaml`.
2. Run code generation.
3. Update server and frontend callers.
4. Run typechecks.

## Personalized discovery

`GET /api/explore/trending` returns:

- `featured` — public Cortado saves ranked using recency, ratings, community activity, profile interests, and saved tutorial topics.
- `lists` — public playlists ranked using list content, interests, saved topics, and recency.
- `editorialVideos` — verified YouTube tutorial metadata used for cold-start recommendations when there is no public Cortado activity.
- `isPersonalized` — whether interests or saved tutorials influenced ranking.
- `trendingBasis` and `listsBasis` — honest descriptions of how the results were ranked.

This is Cortado community trending, not a claim about global YouTube view counts. A YouTube API key is not required for the current discovery fallback.

## Local development

Install dependencies from the repository root:

```bash
pnpm install
```

The normal Replit workflows are:

```bash
# Frontend
pnpm --filter @workspace/tutord run dev

# API
pnpm --filter @workspace/api-server run dev

# Mockup sandbox
pnpm --filter @workspace/mockup-sandbox run dev
```

The frontend and API are normally started through the configured Replit workflows instead of manually.

For a frontend production build, the Vite config expects the artifact environment values:

```bash
PORT=22694 BASE_PATH=/ pnpm --filter @workspace/tutord run build
```

## Verification

Run the full typecheck:

```bash
pnpm run typecheck
```

Run the discovery ranking tests:

```bash
node --experimental-strip-types --test artifacts/api-server/src/lib/discoveryRanking.test.ts
```

Run API tests that are present in the repository with the project’s configured Node test setup. Do not assume a fresh database: development data may already exist.

## Database changes

Development schema changes are defined in `lib/db/src/schema/`. Use the project’s database tooling and Drizzle workflow rather than replacing the existing database.

Production schema changes are applied through the Replit Publish flow. Review the schema diff before accepting a production change. Never put production credentials in the repository.

## Object storage

Profile images are stored in Replit App Storage, not PostgreSQL. The database stores the returned object path. Ownership, MIME type, size, and ACL checks are handled by the API storage helpers.

## Deployment

The Cortado artifact configuration is:

- `artifacts/tutord/.replit-artifact/artifact.toml`

The published app uses the artifact’s production build and static output. After changing application code:

1. Run typechecks and relevant tests.
2. Confirm the frontend and API workflows start successfully.
3. Review any database schema changes shown by the Publish flow.
4. Publish the project.
5. Verify signup, onboarding, profile loading, Explore, saving a video, and playlist navigation in the published URL.

## Common troubleshooting

### Signup stays on “Redirecting”

Check:

1. The published build includes the latest `artifacts/tutord/src/App.tsx`.
2. `GET /api/profile` returns a successful response for the signed-in user.
3. The production database schema is current.
4. The user’s existing username is accepted by the profile response schema.

The current client shows a retry state instead of silently staying on an indefinite redirect.

### Explore fails to load

Check:

1. The API workflow is running.
2. The browser is signed in, because discovery is personalized and protected.
3. Public entries or verified editorial fallback data are available.
4. The API response matches the generated `ExploreData` contract.

### YouTube metadata is incomplete

Without a YouTube API key, the app uses public oEmbed metadata where possible. Playlist imports can save a playlist shell without the full item list. This is an intentional graceful fallback.

## Safe Git practices

Do not commit:

- `.env` files
- Clerk secret keys
- session secrets
- database URLs
- App Storage credentials
- `node_modules`
- build output such as `dist`

The repository’s `.gitignore` covers the standard generated and secret-bearing paths. Review `git status` before committing.