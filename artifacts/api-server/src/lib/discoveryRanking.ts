/**
 * Ranking helpers for Cortado discovery.
 *
 * These functions deliberately only consume rows that the caller has already
 * scoped to public entries/playlists. Keeping the scoring pure makes the
 * privacy boundary easy to audit and keeps recommendation behavior testable.
 */

export type DiscoveryVideo = {
  id: string;
  youtubeId: string;
  title: string;
  channelName: string;
  description?: string | null;
};

export type DiscoveryEntryRow = {
  entry: {
    id: string;
    videoId: string;
    rating: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  video: DiscoveryVideo;
};

export type DiscoveryPlaylistCandidate = {
  playlist: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
  };
  videos: DiscoveryVideo[];
};

export type DiscoverySignals = {
  interests: string[];
  savedVideos: DiscoveryVideo[];
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "beginner",
  "best",
  "by",
  "course",
  "for",
  "from",
  "full",
  "guide",
  "how",
  "into",
  "learn",
  "of",
  "on",
  "the",
  "this",
  "to",
  "tutorial",
  "with",
  "you",
  "your",
]);

function dateValue(value: Date | string): number {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function daysSince(value: Date, now: Date): number {
  return Math.max(0, (now.getTime() - dateValue(value)) / 86_400_000);
}

function freshness(value: Date, now: Date): number {
  // A 45-day half-life keeps recency meaningful without making a new, low
  // signal entry outrank a consistently useful community favorite.
  return Math.exp(-daysSince(value, now) / 45);
}

export function discoveryTokens(value: string): string[] {
  return [...new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^a-z0-9+#.]+/g, " ")
      .split(/\s+/)
      .map((token) => token.replace(/^[+#.]+|[+#.]+$/g, ""))
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )];
}

function signalTerms(signals: DiscoverySignals): Set<string> {
  return new Set([
    ...signals.interests.flatMap(discoveryTokens),
    ...signals.savedVideos.flatMap((video) =>
      discoveryTokens(`${video.title} ${video.channelName} ${video.description ?? ""}`),
    ),
  ]);
}

function signalMatch(
  text: string,
  interests: string[],
  savedTerms: Set<string>,
): number {
  const tokens = discoveryTokens(text);
  if (!tokens.length) return 0;

  const interestTerms = new Set(interests.flatMap(discoveryTokens));
  let interestMatches = 0;
  let savedMatches = 0;
  for (const token of tokens) {
    if (interestTerms.has(token)) interestMatches += 1;
    if (savedTerms.has(token)) savedMatches += 1;
  }

  // Interest matches are intentional profile signals; saved-title matches
  // provide a gentler cold-start signal from the user's existing library.
  return Math.min(1, interestMatches * 0.24 + savedMatches * 0.12);
}

function entryText(row: DiscoveryEntryRow): string {
  return `${row.video.title} ${row.video.channelName} ${row.video.description ?? ""}`;
}

/**
 * Rank one representative public entry per YouTube video.
 *
 * Popularity here means the number of public Cortado saves for that video,
 * not YouTube views. A public row is required from the caller, so private
 * entries cannot influence either the count or the returned representative.
 */
export function rankTrendingEntries<T extends DiscoveryEntryRow>(
  rows: T[],
  signals: DiscoverySignals = { interests: [], savedVideos: [] },
  now = new Date(),
): T[] {
  const byVideo = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.video.youtubeId || row.entry.videoId;
    const existing = byVideo.get(key);
    if (existing) existing.push(row);
    else byVideo.set(key, [row]);
  }

  const savedTerms = signalTerms(signals);
  return [...byVideo.values()]
    .map((videoRows) => {
      const representative = [...videoRows].sort(
        (left, right) =>
          dateValue(right.entry.createdAt) - dateValue(left.entry.createdAt) ||
          right.entry.id.localeCompare(left.entry.id),
      )[0];
      const averageRating =
        videoRows.reduce((total, row) => total + (row.entry.rating ?? 0), 0) /
        videoRows.length /
        5;
      const popularity = Math.min(1, Math.log1p(videoRows.length) / Math.log(6));
      const recency = freshness(representative.entry.createdAt, now);
      const personalization = signalMatch(
        entryText(representative),
        signals.interests,
        savedTerms,
      );

      return {
        representative,
        score:
          popularity * 0.5 +
          recency * 0.3 +
          averageRating * 0.1 +
          personalization * 0.1,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        dateValue(right.representative.entry.createdAt) -
          dateValue(left.representative.entry.createdAt) ||
        left.representative.video.youtubeId.localeCompare(
          right.representative.video.youtubeId,
        ),
    )
    .map(({ representative }) => representative);
}

function playlistText(candidate: DiscoveryPlaylistCandidate): string {
  return [
    candidate.playlist.title,
    candidate.playlist.description ?? "",
    ...candidate.videos.map((video) =>
      `${video.title} ${video.channelName} ${video.description ?? ""}`,
    ),
  ].join(" ");
}

/**
 * Rank public playlists for the signed-in learner.
 *
 * A playlist's content relevance is based on profile interests and titles of
 * videos the learner has saved. Recency and the number of videos are only
 * tie-breaking community signals; no YouTube-wide popularity is implied.
 */
export function rankCuratedPlaylists<T extends DiscoveryPlaylistCandidate>(
  candidates: T[],
  signals: DiscoverySignals = { interests: [], savedVideos: [] },
  now = new Date(),
): T[] {
  const savedTerms = signalTerms(signals);
  return candidates
    .map((candidate) => {
      const relevance = signalMatch(
        playlistText(candidate),
        signals.interests,
        savedTerms,
      );
      const recency = freshness(candidate.playlist.createdAt, now);
      const sizeSignal = Math.min(1, candidate.videos.length / 12);
      return {
        candidate,
        score: relevance * 0.65 + recency * 0.2 + sizeSignal * 0.15,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        dateValue(right.candidate.playlist.createdAt) -
          dateValue(left.candidate.playlist.createdAt) ||
        left.candidate.playlist.id.localeCompare(right.candidate.playlist.id),
    )
    .map(({ candidate }) => candidate);
}

/**
 * Editorial fallback ordering is intentionally separate from trending. The
 * caller must verify each URL through YouTube oEmbed before returning it.
 */
export function rankEditorialVideos<T extends DiscoveryVideo>(
  videos: T[],
  signals: DiscoverySignals = { interests: [], savedVideos: [] },
): T[] {
  const savedTerms = signalTerms(signals);
  return videos
    .map((video) => ({
      video,
      score: signalMatch(
        `${video.title} ${video.channelName} ${video.description ?? ""}`,
        signals.interests,
        savedTerms,
      ),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.video.youtubeId.localeCompare(right.video.youtubeId),
    )
    .map(({ video }) => video);
}