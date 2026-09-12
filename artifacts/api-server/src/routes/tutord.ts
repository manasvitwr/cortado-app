import { Router, type IRouter, type Request } from "express";
import { getAuth } from "@clerk/express";
import {
  AddVideoToPlaylistBody,
  AddVideoToPlaylistParams,
  AddVideoToPlaylistResponse,
  CreateEntryBody,
  CreateEntryResponse,
  CreatePlaylistBody,
  CreatePlaylistResponse,
  DeleteEntryParams,
  DeletePlaylistParams,
  GetDashboardResponse,
  GetEntriesQueryParams,
  GetEntriesResponse,
  GetEntryParams,
  GetEntryResponse,
  GetPlaylistParams,
  GetPlaylistResponse,
  GetPlaylistsResponse,
  GetProfileResponse,
  GetTrendingResponse,
  ImportPlaylistBody,
  ImportPlaylistResponse,
  RemoveVideoFromPlaylistParams,
  UpdateEntryBody,
  UpdateEntryParams,
  UpdateEntryResponse,
  UpdatePlaylistBody,
  UpdatePlaylistParams,
  UpdatePlaylistResponse,
} from "@workspace/api-zod";
import {
  db,
  entriesTable,
  playlistVideosTable,
  playlistsTable,
  profilesTable,
  videosTable,
  type EntryRecord,
  type PlaylistRecord,
  type VideoRecord,
} from "@workspace/db";
import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  getYouTubePlaylistMetadata,
  getYouTubeVideoMetadata,
  isYouTubePlaylist,
  type YouTubeVideoMetadata,
} from "../lib/youtube";

const router: IRouter = Router();

function currentUserId(req: Request): string | null {
  const auth = getAuth(req);
  const claimedUserId = auth.sessionClaims?.userId;
  return typeof claimedUserId === "string" ? claimedUserId : auth.userId;
}

function requireUserId(req: Request): string {
  const userId = currentUserId(req);
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

function videoJson(video: VideoRecord) {
  return {
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    channelName: video.channelName,
    description: video.description,
    duration: video.duration,
    originalUrl: video.originalUrl,
  };
}

function entryJson(entry: EntryRecord, video: VideoRecord) {
  return {
    id: entry.id,
    video: videoJson(video),
    caption: entry.caption,
    summary: entry.summary,
    notes: entry.notes,
    rating: entry.rating,
    status: entry.status as "watchlist" | "watching" | "watched",
    visibility: entry.visibility as "private" | "public",
    watchedAt: entry.watchedAt,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

async function upsertVideo(metadata: YouTubeVideoMetadata): Promise<VideoRecord> {
  const [video] = await db
    .insert(videosTable)
    .values(metadata)
    .onConflictDoUpdate({
      target: videosTable.youtubeId,
      set: {
        title: metadata.title,
        thumbnailUrl: metadata.thumbnailUrl,
        channelName: metadata.channelName,
        description: metadata.description,
        duration: metadata.duration,
        originalUrl: metadata.originalUrl,
      },
    })
    .returning();
  return video;
}

async function getEntryRows(userId?: string) {
  const condition = userId
    ? eq(entriesTable.userId, userId)
    : eq(entriesTable.visibility, "public");
  return db
    .select({ entry: entriesTable, video: videosTable })
    .from(entriesTable)
    .innerJoin(videosTable, eq(entriesTable.videoId, videosTable.id))
    .where(condition)
    .orderBy(desc(entriesTable.createdAt));
}

async function playlistJson(playlist: PlaylistRecord) {
  const rows = await db
    .select({ video: videosTable })
    .from(playlistVideosTable)
    .innerJoin(videosTable, eq(playlistVideosTable.videoId, videosTable.id))
    .where(eq(playlistVideosTable.playlistId, playlist.id))
    .orderBy(asc(playlistVideosTable.position));

  return {
    id: playlist.id,
    youtubePlaylistId: playlist.youtubePlaylistId,
    title: playlist.title,
    description: playlist.description,
    thumbnailUrl: playlist.thumbnailUrl ?? rows[0]?.video.thumbnailUrl ?? null,
    originalUrl: playlist.originalUrl,
    visibility: playlist.visibility as "private" | "public",
    source: playlist.source as "custom" | "youtube",
    videoCount: rows.length,
    videos: rows.map(({ video }) => videoJson(video)),
    createdAt: playlist.createdAt.toISOString(),
  };
}

function unauthorizedResponse(error: unknown): error is Error {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

router.get("/dashboard", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const [ownRows, publicRows, publicLists] = await Promise.all([
      getEntryRows(userId),
      getEntryRows(),
      db
        .select()
        .from(playlistsTable)
        .where(eq(playlistsTable.visibility, "public"))
        .orderBy(desc(playlistsTable.createdAt))
        .limit(6),
    ]);
    const own = ownRows.map(({ entry, video }) => entryJson(entry, video));
    const popular = publicRows
      .filter(({ entry }) => entry.userId !== userId)
      .slice(0, 8)
      .map(({ entry, video }) => entryJson(entry, video));
    const profile = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, userId))
      .limit(1);
    const displayName = profile[0]?.displayName ?? "learner";

    res.json(
      GetDashboardResponse.parse({
        greeting: `Hello, ${displayName}`,
        watchlist: own.filter((entry) => entry.status === "watchlist").slice(0, 8),
        recentlyAdded: own.slice(0, 8),
        popularThisMonth: popular.length ? popular : own.slice(0, 8),
        popularLists: await Promise.all(publicLists.map(playlistJson)),
      }),
    );
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.get("/explore/trending", async (_req, res): Promise<void> => {
  const [entryRows, playlists] = await Promise.all([
    getEntryRows(),
    db
      .select()
      .from(playlistsTable)
      .where(eq(playlistsTable.visibility, "public"))
      .orderBy(desc(playlistsTable.createdAt))
      .limit(12),
  ]);
  res.json(
    GetTrendingResponse.parse({
      featured: entryRows
        .slice(0, 16)
        .map(({ entry, video }) => entryJson(entry, video)),
      lists: await Promise.all(playlists.map(playlistJson)),
    }),
  );
});

router.get("/entries", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const parsed = GetEntriesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const conditions = [eq(entriesTable.userId, userId)];
    if (parsed.data.status) conditions.push(eq(entriesTable.status, parsed.data.status));
    const search = parsed.data.search?.trim();
    if (search) {
      conditions.push(
        or(
          ilike(videosTable.title, `%${search}%`),
          ilike(videosTable.channelName, `%${search}%`),
        )!,
      );
    }

    const rows = await db
      .select({ entry: entriesTable, video: videosTable })
      .from(entriesTable)
      .innerJoin(videosTable, eq(entriesTable.videoId, videosTable.id))
      .where(and(...conditions))
      .orderBy(desc(entriesTable.createdAt));

    res.json(
      GetEntriesResponse.parse(
        rows.map(({ entry, video }) => entryJson(entry, video)),
      ),
    );
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.post("/entries", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const parsed = CreateEntryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (isYouTubePlaylist(parsed.data.url)) {
      res.status(400).json({ error: "Use playlist import for playlist URLs." });
      return;
    }

    const metadata = await getYouTubeVideoMetadata(parsed.data.url);
    const video = await upsertVideo(metadata);
    const watchedAt =
      parsed.data.status === "watched"
        ? new Date().toISOString().slice(0, 10)
        : null;
    const [entry] = await db
      .insert(entriesTable)
      .values({
        userId,
        videoId: video.id,
        caption: parsed.data.caption || null,
        summary: parsed.data.summary || null,
        notes: parsed.data.notes || null,
        rating: parsed.data.rating ?? null,
        status: parsed.data.status ?? "watchlist",
        visibility: parsed.data.visibility ?? "private",
        watchedAt,
      })
      .onConflictDoUpdate({
        target: [entriesTable.userId, entriesTable.videoId],
        set: {
          caption: parsed.data.caption || null,
          summary: parsed.data.summary || null,
          notes: parsed.data.notes || null,
          rating: parsed.data.rating ?? null,
          status: parsed.data.status ?? "watchlist",
          visibility: parsed.data.visibility ?? "private",
          watchedAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.status(201).json(CreateEntryResponse.parse(entryJson(entry, video)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.log.warn({ error }, "Could not save YouTube entry");
    res.status(400).json({
      error: error instanceof Error ? error.message : "Could not save video.",
    });
  }
});

router.get("/entries/:entryId", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const params = GetEntryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .select({ entry: entriesTable, video: videosTable })
      .from(entriesTable)
      .innerJoin(videosTable, eq(entriesTable.videoId, videosTable.id))
      .where(
        and(
          eq(entriesTable.id, params.data.entryId),
          or(
            eq(entriesTable.userId, userId),
            eq(entriesTable.visibility, "public"),
          ),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.json(GetEntryResponse.parse(entryJson(row.entry, row.video)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.patch("/entries/:entryId", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const params = UpdateEntryParams.safeParse(req.params);
    const body = UpdateEntryBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const values = {
      ...body.data,
      watchedAt:
        body.data.status === "watched"
          ? new Date().toISOString().slice(0, 10)
          : body.data.status
            ? null
            : undefined,
      updatedAt: new Date(),
    };
    const [entry] = await db
      .update(entriesTable)
      .set(values)
      .where(
        and(
          eq(entriesTable.id, params.data.entryId),
          eq(entriesTable.userId, userId),
        ),
      )
      .returning();
    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    const [video] = await db
      .select()
      .from(videosTable)
      .where(eq(videosTable.id, entry.videoId))
      .limit(1);
    res.json(UpdateEntryResponse.parse(entryJson(entry, video)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.delete("/entries/:entryId", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const params = DeleteEntryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const deleted = await db
      .delete(entriesTable)
      .where(
        and(
          eq(entriesTable.id, params.data.entryId),
          eq(entriesTable.userId, userId),
        ),
      )
      .returning({ id: entriesTable.id });
    if (!deleted.length) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.get("/playlists", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const playlists = await db
      .select()
      .from(playlistsTable)
      .where(eq(playlistsTable.ownerId, userId))
      .orderBy(desc(playlistsTable.createdAt));
    res.json(
      GetPlaylistsResponse.parse(await Promise.all(playlists.map(playlistJson))),
    );
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.post("/playlists", async (req, res): Promise<void> => {
  try {
    const ownerId = requireUserId(req);
    const parsed = CreatePlaylistBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [playlist] = await db
      .insert(playlistsTable)
      .values({
        ownerId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        visibility: parsed.data.visibility ?? "private",
        source: "custom",
      })
      .returning();
    res.status(201).json(CreatePlaylistResponse.parse(await playlistJson(playlist)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.post("/playlists/import", async (req, res): Promise<void> => {
  try {
    const ownerId = requireUserId(req);
    const parsed = ImportPlaylistBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const metadata = await getYouTubePlaylistMetadata(parsed.data.url);
    const [playlist] = await db
      .insert(playlistsTable)
      .values({
        ownerId,
        youtubePlaylistId: metadata.playlistId,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        originalUrl: metadata.originalUrl,
        visibility: "private",
        source: "youtube",
      })
      .returning();
    const videos = await Promise.all(metadata.videos.map(upsertVideo));
    if (videos.length) {
      await db.insert(playlistVideosTable).values(
        videos.map((video, position) => ({
          playlistId: playlist.id,
          videoId: video.id,
          position,
        })),
      );
    }
    res.status(201).json(ImportPlaylistResponse.parse(await playlistJson(playlist)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.log.warn({ error }, "Could not import YouTube playlist");
    res.status(400).json({
      error: error instanceof Error ? error.message : "Could not import playlist.",
    });
  }
});

router.get("/playlists/:playlistId", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const params = GetPlaylistParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [playlist] = await db
      .select()
      .from(playlistsTable)
      .where(
        and(
          eq(playlistsTable.id, params.data.playlistId),
          or(
            eq(playlistsTable.ownerId, userId),
            eq(playlistsTable.visibility, "public"),
          ),
        ),
      )
      .limit(1);
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(GetPlaylistResponse.parse(await playlistJson(playlist)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.patch("/playlists/:playlistId", async (req, res): Promise<void> => {
  try {
    const ownerId = requireUserId(req);
    const params = UpdatePlaylistParams.safeParse(req.params);
    const body = UpdatePlaylistBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [playlist] = await db
      .update(playlistsTable)
      .set({
        title: body.data.title,
        description: body.data.description,
        visibility: body.data.visibility,
      })
      .where(
        and(
          eq(playlistsTable.id, params.data.playlistId),
          eq(playlistsTable.ownerId, ownerId),
        ),
      )
      .returning();
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(UpdatePlaylistResponse.parse(await playlistJson(playlist)));
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.delete("/playlists/:playlistId", async (req, res): Promise<void> => {
  try {
    const ownerId = requireUserId(req);
    const params = DeletePlaylistParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const deleted = await db
      .delete(playlistsTable)
      .where(
        and(
          eq(playlistsTable.id, params.data.playlistId),
          eq(playlistsTable.ownerId, ownerId),
        ),
      )
      .returning({ id: playlistsTable.id });
    if (!deleted.length) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.sendStatus(204);
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.post("/playlists/:playlistId/videos", async (req, res): Promise<void> => {
  try {
    const ownerId = requireUserId(req);
    const params = AddVideoToPlaylistParams.safeParse(req.params);
    const body = AddVideoToPlaylistBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [playlist] = await db
      .select()
      .from(playlistsTable)
      .where(
        and(
          eq(playlistsTable.id, params.data.playlistId),
          eq(playlistsTable.ownerId, ownerId),
        ),
      )
      .limit(1);
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    const count = await db
      .select({ id: playlistVideosTable.id })
      .from(playlistVideosTable)
      .where(eq(playlistVideosTable.playlistId, playlist.id));
    await db
      .insert(playlistVideosTable)
      .values({
        playlistId: playlist.id,
        videoId: body.data.videoId,
        position: count.length,
      })
      .onConflictDoNothing();
    res.status(201).json(
      AddVideoToPlaylistResponse.parse(await playlistJson(playlist)),
    );
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

router.delete(
  "/playlists/:playlistId/videos/:videoId",
  async (req, res): Promise<void> => {
    try {
      const ownerId = requireUserId(req);
      const params = RemoveVideoFromPlaylistParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }
      const owned = await db
        .select({ id: playlistsTable.id })
        .from(playlistsTable)
        .where(
          and(
            eq(playlistsTable.id, params.data.playlistId),
            eq(playlistsTable.ownerId, ownerId),
          ),
        )
        .limit(1);
      if (!owned.length) {
        res.status(404).json({ error: "Playlist not found" });
        return;
      }
      await db
        .delete(playlistVideosTable)
        .where(
          and(
            eq(playlistVideosTable.playlistId, params.data.playlistId),
            eq(playlistVideosTable.videoId, params.data.videoId),
          ),
        );
      res.sendStatus(204);
    } catch (error) {
      if (unauthorizedResponse(error)) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      throw error;
    }
  },
);

router.get("/profile", async (req, res): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const [entryRows, playlists, profileRows] = await Promise.all([
      getEntryRows(userId),
      db
        .select()
        .from(playlistsTable)
        .where(eq(playlistsTable.ownerId, userId))
        .orderBy(desc(playlistsTable.createdAt)),
      db
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, userId))
        .limit(1),
    ]);
    let profile = profileRows[0];
    if (!profile) {
      const shortId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
      [profile] = await db
        .insert(profilesTable)
        .values({
          id: userId,
          username: `learner_${shortId}`,
          displayName: "Tutord learner",
        })
        .onConflictDoNothing()
        .returning();
      if (!profile) {
        [profile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.id, userId))
          .limit(1);
      }
    }
    const entries = entryRows.map(({ entry, video }) => entryJson(entry, video));
    res.json(
      GetProfileResponse.parse({
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        stats: {
          videosSaved: entries.length,
          videosWatched: entries.filter((entry) => entry.status === "watched")
            .length,
          playlistsCreated: playlists.length,
        },
        recentEntries: entries.slice(0, 8),
        publicPlaylists: await Promise.all(
          playlists
            .filter((playlist) => playlist.visibility === "public")
            .map(playlistJson),
        ),
      }),
    );
  } catch (error) {
    if (unauthorizedResponse(error)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    throw error;
  }
});

export default router;