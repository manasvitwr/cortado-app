export type YouTubeVideoMetadata = {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  description: string | null;
  duration: string | null;
  originalUrl: string;
};

export type YouTubePlaylistMetadata = {
  playlistId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  originalUrl: string;
  videos: YouTubeVideoMetadata[];
  fullyImported: boolean;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function extractYouTubeVideoId(input: string): string | null {
  try {
    const url = new URL(input);
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (url.hostname.toLowerCase() === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] ?? null;
    }
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

export function extractYouTubePlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.searchParams.get("list");
  } catch {
    return null;
  }
}

export function isYouTubePlaylist(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      url.pathname.includes("/playlist") ||
      (!url.searchParams.get("v") && Boolean(url.searchParams.get("list")))
    );
  } catch {
    return false;
  }
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`YouTube request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Fetch the public metadata endpoint without requiring a YouTube API key.
 * Discovery uses this for editorial cold-start items so those items are
 * verified live rather than presented from an invented local catalog.
 */
export async function getYouTubeVideoOEmbedMetadata(
  input: string,
): Promise<YouTubeVideoMetadata> {
  const youtubeId = extractYouTubeVideoId(input);
  if (!youtubeId) throw new Error("Paste a valid YouTube video or Shorts URL.");

  const originalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const oembed = await fetchJson<{
    title: string;
    author_name: string;
    thumbnail_url?: string;
  }>(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(originalUrl)}&format=json`,
  );

  return {
    youtubeId,
    title: oembed.title,
    thumbnailUrl: oembed.thumbnail_url ?? getThumbnailUrl(youtubeId),
    channelName: oembed.author_name,
    description: null,
    duration: null,
    originalUrl,
  };
}

export async function getYouTubeVideoMetadata(
  input: string,
): Promise<YouTubeVideoMetadata> {
  const youtubeId = extractYouTubeVideoId(input);
  if (!youtubeId) throw new Error("Paste a valid YouTube video or Shorts URL.");

  const originalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    const data = await fetchJson<{
      items?: Array<{
        snippet?: {
          title?: string;
          channelTitle?: string;
          description?: string;
          thumbnails?: { maxres?: { url?: string }; high?: { url?: string } };
        };
        contentDetails?: { duration?: string };
      }>;
    }>(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(youtubeId)}&key=${encodeURIComponent(apiKey)}`,
    );
    const item = data.items?.[0];
    if (item?.snippet?.title) {
      return {
        youtubeId,
        title: item.snippet.title,
        thumbnailUrl:
          item.snippet.thumbnails?.maxres?.url ??
          item.snippet.thumbnails?.high?.url ??
          getThumbnailUrl(youtubeId),
        channelName: item.snippet.channelTitle ?? "YouTube",
        description: item.snippet.description ?? null,
        duration: item.contentDetails?.duration ?? null,
        originalUrl,
      };
    }
  }

  return getYouTubeVideoOEmbedMetadata(originalUrl);
}

export async function getYouTubePlaylistMetadata(
  input: string,
): Promise<YouTubePlaylistMetadata> {
  const playlistId = extractYouTubePlaylistId(input);
  if (!playlistId) throw new Error("Paste a valid YouTube playlist URL.");

  const originalUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      playlistId,
      title: "YouTube playlist",
      description:
        "Add YOUTUBE_API_KEY to import the playlist title, description, and first 25 videos.",
      thumbnailUrl: null,
      originalUrl,
      videos: [],
      fullyImported: false,
    };
  }

  const [playlistData, itemData] = await Promise.all([
    fetchJson<{
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
      }>;
    }>(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`,
    ),
    fetchJson<{
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
          resourceId?: { videoId?: string };
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
      }>;
    }>(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`,
    ),
  ]);

  const playlist = playlistData.items?.[0]?.snippet;
  const videos = (itemData.items ?? []).flatMap((item) => {
    const videoId = item.snippet?.resourceId?.videoId;
    const title = item.snippet?.title;
    if (!videoId || !title) return [];
    return [{
      youtubeId: videoId,
      title,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        getThumbnailUrl(videoId),
      channelName: item.snippet?.channelTitle ?? "YouTube",
      description: item.snippet?.description ?? null,
      duration: null,
      originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    }];
  });

  return {
    playlistId,
    title: playlist?.title ?? "YouTube playlist",
    description: playlist?.description ?? null,
    thumbnailUrl:
      playlist?.thumbnails?.high?.url ??
      playlist?.thumbnails?.medium?.url ??
      videos[0]?.thumbnailUrl ??
      null,
    originalUrl,
    videos,
    fullyImported: true,
  };
}