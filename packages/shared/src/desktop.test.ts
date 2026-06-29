import { expect, test } from "bun:test";
import {
  DesktopLyricsHotBoundsSchema,
  DesktopLyricsPayloadSchema,
  DESKTOP_LYRICS_FPS_VALUES,
} from "./desktop";

test("desktop lyrics payload applies safe defaults for a minimal payload", () => {
  const parsed = DesktopLyricsPayloadSchema.parse({
    enabled: true,
    text: "晚风吹过",
  });

  expect(parsed.enabled).toBe(true);
  expect(parsed.text).toBe("晚风吹过");
  expect(parsed.progress).toBe(0);
  expect(parsed.opacity).toBe(0.92);
  expect(parsed.clickThrough).toBe(true);
  expect(parsed.font.fit.minPx).toBe(24);
  expect(parsed.font.fit.maxPx).toBe(72);
  expect(parsed.motion.fps).toBe(60);
  expect(parsed.position.x).toBe(80);
  expect(parsed.position.y).toBe(80);
});

test("desktop lyrics payload clamps progress opacity and position to transport bounds", () => {
  const parsed = DesktopLyricsPayloadSchema.parse({
    enabled: true,
    text: "boundaries",
    progress: 2,
    opacity: -1,
    position: { x: -20, y: 30000 },
  });

  expect(parsed.progress).toBe(1);
  expect(parsed.opacity).toBe(0);
  expect(parsed.position.x).toBe(0);
  expect(parsed.position.y).toBe(10000);
});

test("desktop lyrics payload validates supported fps values", () => {
  expect(DESKTOP_LYRICS_FPS_VALUES).toEqual([24, 30, 60, 120]);
  expect(
    DesktopLyricsPayloadSchema.parse({
      enabled: true,
      text: "24",
      motion: { fps: 24 },
    }).motion.fps,
  ).toBe(24);
  expect(() =>
    DesktopLyricsPayloadSchema.parse({
      enabled: true,
      text: "bad",
      motion: { fps: 25 },
    }),
  ).toThrow();
});

test("desktop lyrics payload preserves baseline size y and frameRate controls", () => {
  const parsed = DesktopLyricsPayloadSchema.parse({
    enabled: true,
    text: "baseline",
    size: 9,
    y: 2,
    frameRate: 999,
  });

  expect(parsed.size).toBe(1.55);
  expect(parsed.y).toBe(0.92);
  expect(parsed.frameRate).toBe(120);
  expect(
    DesktopLyricsPayloadSchema.parse({
      enabled: true,
      text: "free",
      frameRate: 0,
    }).frameRate,
  ).toBe(0);
});

test("desktop lyrics payload keeps colors and click-through knobs shared across layers", () => {
  const parsed = DesktopLyricsPayloadSchema.parse({
    enabled: true,
    text: "colors",
    colors: {
      primary: "#ffffff",
      secondary: "#ffd166",
      background: "rgba(0, 0, 0, 0.28)",
      glow: "rgba(255, 209, 102, 0.7)",
    },
    clickThrough: false,
    font: {
      family: "Microsoft YaHei UI",
      weight: 700,
      fit: { minPx: 18, maxPx: 96, stepPx: 2, maxLines: 2 },
    },
  });

  expect(parsed.colors.secondary).toBe("#ffd166");
  expect(parsed.clickThrough).toBe(false);
  expect(parsed.font.fit.maxLines).toBe(2);
});

test("desktop lyrics payload preserves baseline metadata typography motion and playback fields", () => {
  const parsed = DesktopLyricsPayloadSchema.parse({
    enabled: true,
    text: "line",
    progressSpan: 5.24,
    title: "Track",
    artist: "Artist",
    playing: true,
    lyricGlowParticles: true,
    cinema: false,
    highlightFollow: true,
    fontFamily: '"Noto Sans SC","Microsoft YaHei",sans-serif',
    fontWeight: 875,
    letterSpacing: 0.4,
    lineHeight: 3,
    lyricScale: 8,
    feather: -1,
    beatMapKey: "mr:42",
    colors: {
      primary: "#fff",
      secondary: "#9fe7ff",
      highlight: "#fff0b8",
      glow: "#9fe7ff",
    },
    motion: {
      fps: 60,
      lyricGlow: true,
      lyricGlowBeat: true,
      lyricGlowStrength: 2,
      highBloom: 9,
      beatGlow: 9,
      beatPulse: 9,
      bass: 9,
    },
    playback: {
      time: -1,
      duration: 360,
      rate: 12,
    },
  });

  expect(parsed.progressSpan).toBe(5.24);
  expect(parsed.title).toBe("Track");
  expect(parsed.artist).toBe("Artist");
  expect(parsed.playing).toBe(true);
  expect(parsed.lyricGlowParticles).toBe(true);
  expect(parsed.cinema).toBe(false);
  expect(parsed.highlightFollow).toBe(true);
  expect(parsed.fontFamily).toContain("Noto Sans SC");
  expect(parsed.fontWeight).toBe(875);
  expect(parsed.letterSpacing).toBe(0.18);
  expect(parsed.lineHeight).toBe(1.35);
  expect(parsed.lyricScale).toBe(1.65);
  expect(parsed.feather).toBe(0);
  expect(parsed.beatMapKey).toBe("mr:42");
  expect(parsed.colors.highlight).toBe("#fff0b8");
  expect(parsed.motion.lyricGlow).toBe(true);
  expect(parsed.motion.lyricGlowStrength).toBe(0.85);
  expect(parsed.motion.highBloom).toBe(1.45);
  expect(parsed.motion.beatGlow).toBe(1.7);
  expect(parsed.motion.beatPulse).toBe(1.4);
  expect(parsed.motion.bass).toBe(1.2);
  expect(parsed.playback.time).toBe(0);
  expect(parsed.playback.duration).toBe(360);
  expect(parsed.playback.rate).toBe(4);
});

test("desktop lyrics hot bounds clamps relative rectangle and preserves ordering", () => {
  const parsed = DesktopLyricsHotBoundsSchema.parse({
    left: -5000,
    top: 20.4,
    right: -4999,
    bottom: 20.6,
  });

  expect(parsed).toEqual({
    left: -2000,
    top: 20,
    right: -1999,
    bottom: 21,
  });
});

test("desktop lyrics hot bounds falls back to a one pixel rectangle for invalid input", () => {
  const parsed = DesktopLyricsHotBoundsSchema.parse({
    left: Number.NaN,
    top: Number.POSITIVE_INFINITY,
    right: Number.NEGATIVE_INFINITY,
    bottom: "bad",
  });

  expect(parsed).toEqual({
    left: 0,
    top: 0,
    right: 1,
    bottom: 1,
  });
});
