import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  realName: text("real_name"),
  bio: text("bio"),
  interests: text("interests").array().notNull().default([]),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  topEntryIds: text("top_entry_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videosTable = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  channelName: text("channel_name").notNull(),
  description: text("description"),
  duration: text("duration"),
  originalUrl: text("original_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entriesTable = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    caption: text("caption"),
    summary: text("summary"),
    notes: text("notes"),
    rating: integer("rating"),
    status: text("status").notNull().default("watchlist"),
    visibility: text("visibility").notNull().default("private"),
    watchedAt: date("watched_at", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [unique("entries_user_video_unique").on(table.userId, table.videoId)],
);

export const playlistsTable = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  youtubePlaylistId: text("youtube_playlist_id"),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  originalUrl: text("original_url"),
  visibility: text("visibility").notNull().default("private"),
  source: text("source").notNull().default("custom"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playlistVideosTable = pgTable(
  "playlist_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlistsTable.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("playlist_videos_playlist_video_unique").on(
      table.playlistId,
      table.videoId,
    ),
  ],
);

export const insertProfileSchema = createInsertSchema(profilesTable);
export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  createdAt: true,
});
export const insertEntrySchema = createInsertSchema(entriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlaylistSchema = createInsertSchema(playlistsTable).omit({
  id: true,
  createdAt: true,
});
export const insertPlaylistVideoSchema = createInsertSchema(
  playlistVideosTable,
).omit({ id: true, createdAt: true });

export type ProfileRecord = typeof profilesTable.$inferSelect;
export type VideoRecord = typeof videosTable.$inferSelect;
export type EntryRecord = typeof entriesTable.$inferSelect;
export type PlaylistRecord = typeof playlistsTable.$inferSelect;
export type PlaylistVideoRecord = typeof playlistVideosTable.$inferSelect;
export type NewVideo = z.infer<typeof insertVideoSchema>;