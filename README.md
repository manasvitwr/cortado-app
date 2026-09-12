# Tutord

Tutord is a mobile-first learning library for saving, rating, annotating, and
organizing YouTube tutorials and playlists.

## What works

- Branded email/password and social sign-in through Clerk
- YouTube video and Shorts URL detection
- Video metadata through YouTube oEmbed, with richer metadata when
  `YOUTUBE_API_KEY` is available
- Captions, manual summaries, notes, ratings, watch status, and visibility
- Custom lists and adding/removing saved videos
- YouTube playlist shells without an API key
- Import of the first 25 playlist videos when `YOUTUBE_API_KEY` is available
- Dashboard, discovery, tutorial detail, list detail, and profile views
- User-uploaded profile banners and avatars through App Storage
- A persistent, user-selected Top 4 tutorial showcase

## Run locally on Replit

The managed workflows run the two services:

- `artifacts/api-server: API Server`
- `artifacts/tutord: web`

Useful checks:

```bash
pnpm run typecheck
pnpm --filter @workspace/db run push
```

## Configuration

Clerk authentication, PostgreSQL, and App Storage are managed by Replit. The
only optional configuration is:

- `YOUTUBE_API_KEY` — enables descriptions, durations, and full playlist imports.

Without it, video saving still works through YouTube oEmbed and playlist URLs
are saved as list shells with a clear message.

Tutord never downloads videos or thumbnails. It stores YouTube IDs, metadata,
and remote thumbnail URLs only.