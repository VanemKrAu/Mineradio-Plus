import { expect, test } from "bun:test";
import {
  PlaylistAddSongAckSchema,
  SongLikeAckSchema,
  SongLikeCheckAckSchema
} from "./mutation";

test("SongLikeAckSchema accepts baseline Netease like ack without leaking raw cookie data", () => {
  const ack = SongLikeAckSchema.parse({
    provider: "netease",
    id: "100",
    liked: true,
    code: 200
  });

  expect(ack).toEqual({
    provider: "netease",
    id: "100",
    liked: true,
    code: 200
  });
  expect(JSON.stringify(ack)).not.toContain("cookie");
});

test("SongLikeCheckAckSchema maps a sparse id liked record", () => {
  const ack = SongLikeCheckAckSchema.parse({
    provider: "netease",
    ids: ["100", "200"],
    liked: { "100": true, "200": false }
  });

  expect(ack.liked["100"]).toBe(true);
  expect(ack.liked["200"]).toBe(false);
});

test("PlaylistAddSongAckSchema accepts playlist add result metadata", () => {
  const ack = PlaylistAddSongAckSchema.parse({
    provider: "netease",
    playlistId: "p1",
    trackId: "100",
    success: true,
    code: 200
  });

  expect(ack.provider).toBe("netease");
  expect(ack.success).toBe(true);
  expect(ack.playlistId).toBe("p1");
});
