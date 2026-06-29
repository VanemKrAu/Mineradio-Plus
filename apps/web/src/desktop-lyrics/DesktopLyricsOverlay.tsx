import type { CSSProperties, PointerEvent } from "react";
import React, { useLayoutEffect, useRef } from "react";
import {
  DesktopLyricsHotBoundsSchema,
  DesktopLyricsPayloadSchema,
  type DesktopLyricsHotBounds,
  type DesktopLyricsPayload,
} from "@mineradio/shared";

export type DesktopLyricsInput = Partial<DesktopLyricsPayload>;

export interface DesktopLyricsDragCallbacks {
  onToggleLock?: () => void;
  onMoveBy?: (dx: number, dy: number) => void;
  onHotBoundsChange?: (bounds: DesktopLyricsHotBounds) => void;
}

export interface DesktopLyricsOverlayProps extends DesktopLyricsDragCallbacks {
  payload: DesktopLyricsInput | null | undefined;
}

export type DesktopLyricsStyle = CSSProperties &
  Record<`--desktop-lyrics-${string}`, string>;

export function normalizeDesktopLyricsPayload(
  payload: DesktopLyricsInput | null | undefined,
): DesktopLyricsPayload {
  return DesktopLyricsPayloadSchema.parse(payload ?? {});
}

export function shouldRenderDesktopLyrics(
  payload: DesktopLyricsInput | null | undefined,
): boolean {
  const normalized = normalizeDesktopLyricsPayload(payload);
  return normalized.enabled && normalized.text.trim().length > 0;
}

export function computeDesktopLyricsStyle(
  payload: DesktopLyricsPayload,
): DesktopLyricsStyle {
  return {
    left: `${payload.position.x}px`,
    top: `calc(${Math.round(payload.y * 100)}vh)`,
    "--desktop-lyrics-progress": `${Math.round(payload.progress * 100)}%`,
    "--desktop-lyrics-size": String(payload.size),
    "--desktop-lyrics-primary": payload.colors.primary,
    "--desktop-lyrics-secondary": payload.colors.secondary,
    "--desktop-lyrics-highlight": payload.colors.highlight,
    "--desktop-lyrics-background": payload.colors.background,
    "--desktop-lyrics-glow": payload.colors.glow,
    "--desktop-lyrics-opacity": String(payload.opacity),
    "--desktop-lyrics-font-family": payload.fontFamily || payload.font.family,
    "--desktop-lyrics-font-weight": String(payload.fontWeight ?? payload.font.weight),
    "--desktop-lyrics-min-font": `${payload.font.fit.minPx}px`,
    "--desktop-lyrics-max-font": `${payload.font.fit.maxPx}px`,
    "--desktop-lyrics-lines": String(payload.font.fit.maxLines),
    "--desktop-lyrics-letter-spacing": `${payload.letterSpacing}em`,
    "--desktop-lyrics-line-height": String(payload.lineHeight),
    "--desktop-lyrics-lyric-scale": String(payload.lyricScale),
    "--desktop-lyrics-feather": String(payload.feather),
    "--desktop-lyrics-glow-strength": String(payload.motion.lyricGlowStrength),
    "--desktop-lyrics-high-bloom": String(payload.motion.highBloom),
    "--desktop-lyrics-beat-glow": String(payload.motion.beatGlow),
    "--desktop-lyrics-beat-pulse": String(payload.motion.beatPulse),
    "--desktop-lyrics-bass": String(payload.motion.bass),
  };
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : useLayoutEffect;

export function computeDesktopLyricsHotBounds(
  rect: Pick<DOMRect, "left" | "top" | "right" | "bottom">,
): DesktopLyricsHotBounds {
  return DesktopLyricsHotBoundsSchema.parse({
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  });
}

export async function reportDesktopLyricsHotBounds(
  node: Pick<HTMLElement, "getBoundingClientRect"> | null | undefined,
  bridge:
    | Pick<DesktopLyricsDragCallbacks, "onHotBoundsChange">
    | {
        setHotBounds?: (bounds: DesktopLyricsHotBounds) => Promise<void> | void;
      },
): Promise<void> {
  if (!node) return;
  const rect = node.getBoundingClientRect();
  if (rect.right <= rect.left || rect.bottom <= rect.top) return;
  const bounds = computeDesktopLyricsHotBounds(rect);
  if ("setHotBounds" in bridge && bridge.setHotBounds) {
    await bridge.setHotBounds(bounds);
    return;
  }
  if ("onHotBoundsChange" in bridge) {
    bridge.onHotBoundsChange?.(bounds);
  }
}

export function areDesktopLyricsHotBoundsEqual(
  left: DesktopLyricsHotBounds | null | undefined,
  right: DesktopLyricsHotBounds | null | undefined,
): boolean {
  return (
    !!left &&
    !!right &&
    left.left === right.left &&
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom
  );
}

export function shouldReportDesktopLyricsHotBounds(
  previous: DesktopLyricsHotBounds | null | undefined,
  next: DesktopLyricsHotBounds,
): boolean {
  return !areDesktopLyricsHotBoundsEqual(previous, next);
}

export function createDesktopLyricsPointerHandlers(
  payload: DesktopLyricsPayload,
  callbacks: DesktopLyricsDragCallbacks,
  drag: { current: { x: number; y: number } | null },
) {
  return {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.button === 1) {
        if (!payload.clickThrough) {
          callbacks.onToggleLock?.();
        }
        return;
      }
      if (event.button !== 0 || payload.clickThrough) {
        return;
      }
      drag.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (!drag.current || payload.clickThrough) {
        return;
      }
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      drag.current = { x: event.clientX, y: event.clientY };
      if (dx !== 0 || dy !== 0) {
        callbacks.onMoveBy?.(dx, dy);
      }
    },
    onPointerUp() {
      drag.current = null;
    },
  };
}

export function DesktopLyricsOverlay({
  payload,
  onToggleLock,
  onMoveBy,
  onHotBoundsChange,
}: DesktopLyricsOverlayProps) {
  const normalized = normalizeDesktopLyricsPayload(payload);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastHotBoundsRef = useRef<DesktopLyricsHotBounds | null>(null);

  const shouldRender = shouldRenderDesktopLyrics(normalized);

  useIsomorphicLayoutEffect(() => {
    if (!shouldRender) return;
    const node = overlayRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.right <= rect.left || rect.bottom <= rect.top) return;
    const bounds = computeDesktopLyricsHotBounds(rect);
    if (!shouldReportDesktopLyricsHotBounds(lastHotBoundsRef.current, bounds))
      return;
    lastHotBoundsRef.current = bounds;
    onHotBoundsChange?.(bounds);
  }, [
    shouldRender,
    onHotBoundsChange,
    normalized.text,
    normalized.position.x,
    normalized.position.y,
    normalized.font.fit.minPx,
    normalized.font.fit.maxPx,
    normalized.font.fit.maxLines,
  ]);

  if (!shouldRender) {
    return null;
  }

  const handlers = createDesktopLyricsPointerHandlers(
    normalized,
    { onToggleLock, onMoveBy },
    drag,
  );

  return (
    <div
      ref={overlayRef}
      className={[
        "desktop-lyrics-overlay",
        normalized.clickThrough
          ? "desktop-lyrics-locked"
          : "desktop-lyrics-unlocked",
      ].join(" ")}
      data-click-through={normalized.clickThrough ? "true" : "false"}
      style={computeDesktopLyricsStyle(normalized)}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
    >
      <span className="desktop-lyrics-text">{normalized.text}</span>
    </div>
  );
}
