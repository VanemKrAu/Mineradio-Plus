//! Map Kugou API response shapes to @mineradio/shared types.

import type {
  Track, PlaylistSummary, LyricPayload, SongUrlResult, PlaybackQuality,
  PlaybackRestriction,
} from "@mineradio/shared";
import type { KugouSearchResult, KugouPlaylistSummary, KugouPlaylistTrack } from "./kugou-client";

const PROVIDER = "kugou" as const;

export function mapKugouSearchToTrack(src: KugouSearchResult): Track {
  return {
    provider: PROVIDER,
    id: src.hash,
    sourceId: src.hash,
    title: src.name,
    artists: src.artists.length > 0 ? src.artists : src.artist ? [src.artist] : [],
    album: src.album || "",
    coverUrl: src.cover || "",
    durationMs: src.duration * 1000,
    mediaMid: src.albumAudioId || undefined,
    qualityHints: [],
    playableState: "unknown",
  };
}

export function mapKugouPlaylistToSummary(src: KugouPlaylistSummary): PlaylistSummary {
  return {
    provider: PROVIDER,
    id: src.id,
    name: src.name,
    coverUrl: src.cover || "",
    trackCount: src.trackCount,
    subscribed: false,
    trackIds: [],
  };
}

export function mapKugouPlaylistTrackToTrack(src: KugouPlaylistTrack): Track {
  return {
    provider: PROVIDER,
    id: src.hash,
    sourceId: src.hash,
    title: src.name,
    artists: src.artist ? [src.artist] : [],
    album: src.album || "",
    coverUrl: src.cover || "",
    durationMs: src.duration * 1000,
    mediaMid: src.albumAudioId || undefined,
    qualityHints: Object.keys(src.qualityHashes),
    playableState: "unknown",
  };
}

export function mapKugouSongUrl(
  urlResult: { url: string; playable: boolean; level: string; quality: string; br: number },
  requestedQuality?: string
): SongUrlResult {
  return {
    url: urlResult.url || null,
    proxied: false,
    playable: urlResult.playable,
    level: (urlResult.level as PlaybackQuality) || undefined,
    quality: urlResult.quality || requestedQuality || "standard",
    br: urlResult.br || undefined,
    trial: false,
  };
}

export function mapKugouLyric(lyricResult: { lyric: string; tlyric?: string }): LyricPayload {
  const lines = parseLrc(lyricResult.lyric);
  return {
    provider: PROVIDER,
    trackId: "",
    lines,
    hasTranslation: !!lyricResult.tlyric,
    isWordByWord: false,
  };
}

function parseLrc(lrc: string): { timeMs: number; text: string }[] {
  const lines: { timeMs: number; text: string }[] = [];
  if (!lrc) return lines;
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(lrc)) !== null) {
    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const ms = parseInt(match[3].padEnd(3, "0"), 10);
    const text = match[4].trim();
    if (text) {
      lines.push({ timeMs: min * 60000 + sec * 1000 + ms, text });
    }
  }
  return lines;
}

export function mapKugouQualityPreference(rawQuality?: string): string | undefined {
  if (!rawQuality) return undefined;
  switch (rawQuality) {
    case "jymaster": return "masterhash";
    case "hires": return "hrhash";
    case "lossless": return "sqhash";
    case "exhigh": return "320hash";
    case "standard": return "128hash";
    default: return "320hash";
  }
}

export function makeUnavailableResult(message: string): SongUrlResult {
  const restriction: PlaybackRestriction = {
    provider: PROVIDER,
    category: "unavailable",
    message,
    action: "",
  };
  return {
    url: null,
    proxied: false,
    playable: false,
    trial: false,
    restriction,
  };
}
