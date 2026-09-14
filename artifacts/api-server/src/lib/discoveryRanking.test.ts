import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  rankCuratedPlaylists,
  rankTrendingEntries,
  type DiscoveryEntryRow,
  type DiscoveryPlaylistCandidate,
} from "./discoveryRanking.ts";

const now = new Date("2025-01-31T00:00:00.000Z");

function entry(
  id: string,
  youtubeId: string,
  title: string,
  createdAt: string,
  rating: number | null = 4,
): DiscoveryEntryRow {
  return {
    entry: {
      id,
      videoId: `${youtubeId}-db-id`,
      rating,
      createdAt: new Date(createdAt),
      updatedAt: new Date(createdAt),
    },
    video: {
      id: `${youtubeId}-db-id`,
      youtubeId,
      title,
      channelName: "Cortado community",
      description: null,
    },
  };
}

function playlist(
  id: string,
  title: string,
  createdAt = "2025-01-20T00:00:00.000Z",
): DiscoveryPlaylistCandidate {
  return {
    playlist: {
      id,
      title,
      description: null,
      createdAt: new Date(createdAt),
    },
    videos: [],
  };
}

describe("discovery ranking", () => {
  it("deduplicates videos and favors multiple recent public saves", () => {
    const rows = [
      entry("old", "same-video", "React hooks", "2024-09-01T00:00:00.000Z"),
      entry("new", "same-video", "React hooks", "2025-01-29T00:00:00.000Z"),
      entry("python", "python-video", "Python basics", "2025-01-30T00:00:00.000Z"),
    ];

    const ranked = rankTrendingEntries(rows, { interests: [], savedVideos: [] }, now);

    assert.equal(ranked.length, 2);
    assert.equal(ranked[0]?.video.youtubeId, "same-video");
    assert.equal(ranked[0]?.entry.id, "new");
  });

  it("uses saved video titles and interests to rank lists", () => {
    const ranked = rankCuratedPlaylists(
      [
        playlist("design", "Product design foundations"),
        playlist("react", "React component patterns"),
      ],
      {
        interests: ["React"],
        savedVideos: [
          {
            id: "saved",
            youtubeId: "saved",
            title: "React state management",
            channelName: "Frontend channel",
            description: null,
          },
        ],
      },
      now,
    );

    assert.equal(ranked[0]?.playlist.id, "react");
  });
});