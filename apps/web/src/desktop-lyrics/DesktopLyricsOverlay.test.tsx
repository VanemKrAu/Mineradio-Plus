import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import {
  DesktopLyricsOverlay,
  areDesktopLyricsHotBoundsEqual,
  computeDesktopLyricsStyle,
  computeDesktopLyricsHotBounds,
  createDesktopLyricsPointerHandlers,
  normalizeDesktopLyricsPayload,
  reportDesktopLyricsHotBounds,
  shouldRenderDesktopLyrics,
  shouldReportDesktopLyricsHotBounds,
  type DesktopLyricsDragCallbacks,
} from "./DesktopLyricsOverlay";

test("normalizeDesktopLyricsPayload delegates transport defaults to shared contract", () => {
  const payload = normalizeDesktopLyricsPayload({
    enabled: true,
    text: "hello",
  });
  expect(payload.motion.fps).toBe(60);
  expect(payload.position.x).toBe(80);
  expect(payload.clickThrough).toBe(true);
});

test("shouldRenderDesktopLyrics requires enabled payload with visible text", () => {
  expect(shouldRenderDesktopLyrics({ enabled: true, text: " line " })).toBe(
    true,
  );
  expect(shouldRenderDesktopLyrics({ enabled: true, text: "   " })).toBe(false);
  expect(shouldRenderDesktopLyrics({ enabled: false, text: "line" })).toBe(
    false,
  );
});

test("computeDesktopLyricsStyle exposes progress and placement CSS hooks", () => {
  const style = computeDesktopLyricsStyle(
    normalizeDesktopLyricsPayload({
      enabled: true,
      text: "line",
      progress: 0.42,
      position: { x: 123, y: 456 },
      size: 1.2,
      y: 0.76,
      colors: {
        primary: "#fff",
        secondary: "#fd0",
        background: "rgba(0,0,0,.3)",
        highlight: "#fff0b8",
        glow: "#fd0",
      },
    }),
  );
  expect(style["--desktop-lyrics-progress"]).toBe("42%");
  expect(style.left).toBe("123px");
  expect(style.top).toBe("calc(76vh)");
  expect(style["--desktop-lyrics-size"]).toBe("1.2");
  expect(style["--desktop-lyrics-primary"]).toBe("#fff");
});

test("computeDesktopLyricsStyle exposes baseline top-level typography and motion hooks", () => {
  const style = computeDesktopLyricsStyle(
    normalizeDesktopLyricsPayload({
      enabled: true,
      text: "line",
      fontFamily: '"Noto Sans SC","Microsoft YaHei",sans-serif',
      fontWeight: 850,
      letterSpacing: 0.08,
      lineHeight: 1.24,
      lyricScale: 1.36,
      feather: 0.03,
      colors: {
        primary: "#fff",
        secondary: "#9fe7ff",
        background: "rgba(0,0,0,.22)",
        highlight: "#fff0b8",
        glow: "#9fe7ff",
      },
      motion: {
        fps: 60,
        reduceMotion: false,
        smoothingMs: 120,
        lyricGlow: true,
        lyricGlowBeat: true,
        lyricGlowStrength: 0.5,
        highBloom: 0.7,
        beatGlow: 0.8,
        beatPulse: 0.9,
        bass: 0.4,
      },
    }),
  );

  expect(style["--desktop-lyrics-font-family"]).toContain("Noto Sans SC");
  expect(style["--desktop-lyrics-font-weight"]).toBe("850");
  expect(style["--desktop-lyrics-letter-spacing"]).toBe("0.08em");
  expect(style["--desktop-lyrics-line-height"]).toBe("1.24");
  expect(style["--desktop-lyrics-lyric-scale"]).toBe("1.36");
  expect(style["--desktop-lyrics-feather"]).toBe("0.03");
  expect(style["--desktop-lyrics-highlight"]).toBe("#fff0b8");
  expect(style["--desktop-lyrics-glow-strength"]).toBe("0.5");
  expect(style["--desktop-lyrics-beat-glow"]).toBe("0.8");
});

test("DesktopLyricsOverlay renders locked class and text from payload", () => {
  const html = renderToStaticMarkup(
    React.createElement(DesktopLyricsOverlay, {
      payload: {
        enabled: true,
        text: "正在播放",
        clickThrough: true,
        progress: 0.5,
      },
    }),
  );
  expect(html).toContain("desktop-lyrics-overlay");
  expect(html).toContain("desktop-lyrics-locked");
  expect(html).toContain("正在播放");
  expect(html).toContain("--desktop-lyrics-progress:50%");
});

test("DesktopLyricsOverlay middle click locks only when unlocked and pointer drag emits delta", () => {
  const calls: Array<[number, number]> = [];
  let lockToggles = 0;
  const callbacks: DesktopLyricsDragCallbacks = {
    onToggleLock: () => {
      lockToggles += 1;
    },
    onMoveBy: (dx, dy) => {
      calls.push([dx, dy]);
    },
  };
  const props = createDesktopLyricsPointerHandlers(
    normalizeDesktopLyricsPayload({
      enabled: true,
      text: "drag",
      clickThrough: false,
    }),
    callbacks,
    { current: null },
  ) as unknown as {
    onPointerDown: (event: {
      button: number;
      clientX: number;
      clientY: number;
      pointerId: number;
      currentTarget: { setPointerCapture: () => void };
    }) => void;
    onPointerMove: (event: { clientX: number; clientY: number }) => void;
    onPointerUp: () => void;
  };

  props.onPointerDown({
    button: 1,
    clientX: 10,
    clientY: 20,
    pointerId: 1,
    currentTarget: { setPointerCapture: () => {} },
  });
  expect(lockToggles).toBe(1);

  props.onPointerDown({
    button: 0,
    clientX: 10,
    clientY: 20,
    pointerId: 1,
    currentTarget: { setPointerCapture: () => {} },
  });
  props.onPointerMove({ clientX: 16, clientY: 27 });
  props.onPointerMove({ clientX: 20, clientY: 30 });
  props.onPointerUp();

  expect(calls).toEqual([
    [6, 7],
    [4, 3],
  ]);
});

test("DesktopLyricsOverlay does not pretend locked click-through can be unlocked by renderer events", () => {
  let lockToggles = 0;
  const props = createDesktopLyricsPointerHandlers(
    normalizeDesktopLyricsPayload({
      enabled: true,
      text: "locked",
      clickThrough: true,
    }),
    {
      onToggleLock: () => {
        lockToggles += 1;
      },
    },
    { current: null },
  ) as unknown as {
    onPointerDown: (event: {
      button: number;
      clientX: number;
      clientY: number;
      pointerId: number;
      currentTarget: { setPointerCapture: () => void };
    }) => void;
  };

  props.onPointerDown({
    button: 1,
    clientX: 10,
    clientY: 20,
    pointerId: 1,
    currentTarget: { setPointerCapture: () => {} },
  });
  expect(lockToggles).toBe(0);
});

test("computeDesktopLyricsHotBounds normalizes DOMRect geometry for native polling", () => {
  const bounds = computeDesktopLyricsHotBounds({
    left: 10.2,
    top: 20.6,
    right: 209.8,
    bottom: 81.2,
  });

  expect(bounds).toEqual({
    left: 10,
    top: 21,
    right: 210,
    bottom: 81,
  });
});

test("reportDesktopLyricsHotBounds skips hidden nodes and sends visible bounds", async () => {
  const sent: unknown[] = [];
  const bridge = {
    async setHotBounds(bounds: unknown) {
      sent.push(bounds);
    },
  };
  const hidden = {
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 0, bottom: 40 };
    },
  };
  const visible = {
    getBoundingClientRect() {
      return { left: 4.2, top: 5.8, right: 180.1, bottom: 45.2 };
    },
  };

  await reportDesktopLyricsHotBounds(hidden as HTMLElement, bridge);
  await reportDesktopLyricsHotBounds(visible as HTMLElement, bridge);

  expect(sent).toEqual([{ left: 4, top: 6, right: 180, bottom: 45 }]);
});

test("areDesktopLyricsHotBoundsEqual compares measured geometry", () => {
  expect(
    areDesktopLyricsHotBoundsEqual(
      { left: 4, top: 6, right: 180, bottom: 45 },
      { left: 4, top: 6, right: 180, bottom: 45 },
    ),
  ).toBe(true);
  expect(
    areDesktopLyricsHotBoundsEqual(
      { left: 4, top: 6, right: 180, bottom: 45 },
      { left: 4, top: 6, right: 181, bottom: 45 },
    ),
  ).toBe(false);
  expect(
    areDesktopLyricsHotBoundsEqual(null, {
      left: 4,
      top: 6,
      right: 180,
      bottom: 45,
    }),
  ).toBe(false);
});

test("shouldReportDesktopLyricsHotBounds only reports geometry changes", () => {
  const previous = { left: 4, top: 6, right: 180, bottom: 45 };
  expect(shouldReportDesktopLyricsHotBounds(null, previous)).toBe(true);
  expect(
    shouldReportDesktopLyricsHotBounds(previous, {
      left: 4,
      top: 6,
      right: 180,
      bottom: 45,
    }),
  ).toBe(false);
  expect(
    shouldReportDesktopLyricsHotBounds(previous, {
      left: 4,
      top: 6,
      right: 181,
      bottom: 45,
    }),
  ).toBe(true);
});
