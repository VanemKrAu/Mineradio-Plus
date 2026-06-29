import { z } from "zod";

export const DESKTOP_LYRICS_FPS_VALUES = [24, 30, 60, 120] as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const ClampedNumberSchema = (min: number, max: number, fallback: number) =>
  z
    .number()
    .finite()
    .catch(fallback)
    .transform((value) => clamp(value, min, max))
    .default(fallback);

const HotBoundNumberSchema = (fallback: number) =>
  z
    .number()
    .finite()
    .catch(fallback)
    .transform((value) => Math.round(clamp(value, -2000, 6000)))
    .default(fallback);

export const DesktopLyricsColorsSchema = z.object({
  primary: z.string().min(1).default("#ffffff"),
  secondary: z.string().min(1).default("#9fe7ff"),
  background: z.string().min(1).default("rgba(0, 0, 0, 0.22)"),
  highlight: z.string().min(1).default("#fff0b8"),
  glow: z.string().min(1).default("rgba(159, 231, 255, 0.68)"),
});

export const DesktopLyricsPositionSchema = z.object({
  x: ClampedNumberSchema(0, 10000, 80),
  y: ClampedNumberSchema(0, 10000, 80),
});

export const DesktopLyricsFontFitSchema = z.object({
  minPx: ClampedNumberSchema(8, 160, 24),
  maxPx: ClampedNumberSchema(8, 240, 72),
  stepPx: ClampedNumberSchema(1, 16, 1),
  maxLines: z.number().int().min(1).max(4).default(1),
});

export const DesktopLyricsFontSchema = z
  .object({
    family: z
      .string()
      .min(1)
      .default("Microsoft YaHei UI, Segoe UI, sans-serif"),
    weight: z
      .union([z.number().int().min(100).max(900), z.string().min(1)])
      .default(700),
    fit: DesktopLyricsFontFitSchema.prefault({}),
  })
  .transform((font) => ({
    ...font,
    fit: {
      ...font.fit,
      maxPx: Math.max(font.fit.minPx, font.fit.maxPx),
    },
  }));

export const DesktopLyricsMotionSchema = z.object({
  fps: z
    .union([z.literal(24), z.literal(30), z.literal(60), z.literal(120)])
    .default(60),
  reduceMotion: z.boolean().default(false),
  smoothingMs: ClampedNumberSchema(0, 2000, 120),
  lyricGlow: z.boolean().default(false),
  lyricGlowBeat: z.boolean().default(false),
  lyricGlowStrength: ClampedNumberSchema(0, 0.85, 0),
  highBloom: ClampedNumberSchema(0, 1.45, 0),
  beatGlow: ClampedNumberSchema(0, 1.7, 0),
  beatPulse: ClampedNumberSchema(0, 1.4, 0),
  bass: ClampedNumberSchema(0, 1.2, 0),
});

export const DesktopLyricsFrameRateSchema = z
  .number()
  .finite()
  .catch(60)
  .transform((value) => {
    if (value <= 0) return 0;
    if (value <= 26) return 24;
    if (value <= 45) return 30;
    if (value <= 90) return 60;
    return 120;
  })
  .default(60);

export const DesktopLyricsHotBoundsSchema = z
  .object({
    left: HotBoundNumberSchema(0),
    top: HotBoundNumberSchema(0),
    right: HotBoundNumberSchema(1),
    bottom: HotBoundNumberSchema(1),
  })
  .transform((bounds) => {
    const right = Math.max(bounds.left + 1, bounds.right);
    const bottom = Math.max(bounds.top + 1, bounds.bottom);
    return {
      left: bounds.left,
      top: bounds.top,
      right,
      bottom,
    };
  });

export const DesktopLyricsPlaybackSchema = z.object({
  time: ClampedNumberSchema(0, 24 * 60 * 60, 0),
  duration: ClampedNumberSchema(0, 24 * 60 * 60, 0),
  rate: ClampedNumberSchema(0.25, 4, 1),
});

export const DesktopLyricsPayloadSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().default(""),
  progress: ClampedNumberSchema(0, 1, 0),
  progressSpan: ClampedNumberSchema(0, 60, 4.8),
  title: z.string().default("Mineradio"),
  artist: z.string().default(""),
  playing: z.boolean().default(false),
  size: ClampedNumberSchema(0.72, 1.55, 1),
  y: ClampedNumberSchema(0.08, 0.92, 0.76),
  frameRate: DesktopLyricsFrameRateSchema,
  colors: DesktopLyricsColorsSchema.prefault({}),
  opacity: ClampedNumberSchema(0, 1, 0.92),
  position: DesktopLyricsPositionSchema.prefault({}),
  clickThrough: z.boolean().default(true),
  lyricGlowParticles: z.boolean().default(false),
  cinema: z.boolean().default(true),
  highlightFollow: z.boolean().default(false),
  fontFamily: z
    .string()
    .min(1)
    .default("Microsoft YaHei UI, Segoe UI, sans-serif"),
  fontWeight: z
    .number()
    .finite()
    .catch(700)
    .transform((value) => clamp(value, 100, 900))
    .default(700),
  letterSpacing: ClampedNumberSchema(-0.04, 0.18, 0),
  lineHeight: ClampedNumberSchema(0.86, 1.35, 1),
  lyricScale: ClampedNumberSchema(0.35, 1.65, 1),
  feather: ClampedNumberSchema(0, 0.12, 0.055),
  beatMapKey: z.string().default(""),
  beatMap: z.unknown().optional(),
  font: DesktopLyricsFontSchema.prefault({}),
  motion: DesktopLyricsMotionSchema.prefault({}),
  playback: DesktopLyricsPlaybackSchema.prefault({}),
});

export type DesktopLyricsPayload = z.infer<typeof DesktopLyricsPayloadSchema>;
export type DesktopLyricsHotBounds = z.infer<
  typeof DesktopLyricsHotBoundsSchema
>;
