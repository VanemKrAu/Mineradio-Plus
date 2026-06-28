import { z } from "zod";
import { ProviderIdSchema } from "./provider";

export const SongLikeAckSchema = z.object({
  provider: ProviderIdSchema,
  id: z.string().min(1),
  liked: z.boolean(),
  code: z.number().int().optional()
});

export const SongLikeCheckAckSchema = z.object({
  provider: ProviderIdSchema,
  ids: z.array(z.string().min(1)),
  liked: z.record(z.string(), z.boolean())
});

export const PlaylistAddSongAckSchema = z.object({
  provider: ProviderIdSchema,
  playlistId: z.string().min(1),
  trackId: z.string().min(1),
  success: z.boolean(),
  code: z.number().int().optional()
});

export type SongLikeAck = z.infer<typeof SongLikeAckSchema>;
export type SongLikeCheckAck = z.infer<typeof SongLikeCheckAckSchema>;
export type PlaylistAddSongAck = z.infer<typeof PlaylistAddSongAckSchema>;
