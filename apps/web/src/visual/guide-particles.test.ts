import { expect, test } from "bun:test";
import "../../../../packages/visual-engine/src/runtime/happy-dom-preload";
import {
	IDLE_GUIDE_BACKGROUND_ENABLED,
	createIdleGuideParticleField,
	projectIdleGuidePoint,
	runLoginGuideParticles,
} from "./guide-particles";

type CanvasCall = { name: string; args: unknown[] };

function installLoginCanvas() {
	const canvas = document.createElement("canvas") as HTMLCanvasElement & {
		calls: CanvasCall[];
	};
	canvas.id = "login-guide-canvas";
	canvas.calls = [];
	const ctx = {
		globalCompositeOperation: "source-over",
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 0,
		setTransform: (...args: unknown[]) => canvas.calls.push({ name: "setTransform", args }),
		clearRect: (...args: unknown[]) => canvas.calls.push({ name: "clearRect", args }),
		createRadialGradient: (...args: unknown[]) => {
			canvas.calls.push({ name: "createRadialGradient", args });
			return { addColorStop: (...stopArgs: unknown[]) => canvas.calls.push({ name: "addColorStop", args: stopArgs }) };
		},
		fillRect: (...args: unknown[]) => canvas.calls.push({ name: "fillRect", args }),
		beginPath: (...args: unknown[]) => canvas.calls.push({ name: "beginPath", args }),
		arc: (...args: unknown[]) => canvas.calls.push({ name: "arc", args }),
		fill: (...args: unknown[]) => canvas.calls.push({ name: "fill", args }),
		moveTo: (...args: unknown[]) => canvas.calls.push({ name: "moveTo", args }),
		lineTo: (...args: unknown[]) => canvas.calls.push({ name: "lineTo", args }),
		stroke: (...args: unknown[]) => canvas.calls.push({ name: "stroke", args }),
	};
	canvas.getContext = ((kind: string) => kind === "2d" ? ctx : null) as never;
	document.body.appendChild(canvas);
	return canvas;
}

test("runLoginGuideParticles builds the baseline 92-particle login burst and toggles the body class", async () => {
	document.body.innerHTML = "";
	document.body.className = "";
	const canvas = installLoginCanvas();
	const previousRaf = window.requestAnimationFrame;
	const previousCancel = window.cancelAnimationFrame;
	const previousRandom = Math.random;
	let rafCallback: FrameRequestCallback | null = null;
	window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
		rafCallback = cb;
		return 7;
	}) as never;
	window.cancelAnimationFrame = (() => {}) as never;
	Math.random = () => 0.5;
	try {
		let done = false;
		const state = runLoginGuideParticles({ reduceMotion: false, now: () => 0, done: () => { done = true; } });
		expect(state.started).toBe(true);
		expect(state.particleCount).toBe(92);
		expect(document.body.classList.contains("login-guide-active")).toBe(true);
		expect(canvas.width).toBe(Math.floor(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.8)));
		expect(canvas.height).toBe(Math.floor(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.8)));
		expect(typeof rafCallback).toBe("function");
		const drawFrame = rafCallback as unknown as FrameRequestCallback;
		drawFrame(600);
		expect(canvas.calls.some((call) => call.name === "createRadialGradient")).toBe(true);
		expect(canvas.calls.some((call) => call.name === "arc")).toBe(true);
		drawFrame(1200);
		expect(document.body.classList.contains("login-guide-active")).toBe(false);
		expect(done).toBe(true);
	} finally {
		window.requestAnimationFrame = previousRaf;
		window.cancelAnimationFrame = previousCancel;
		Math.random = previousRandom;
	}
});

test("runLoginGuideParticles follows baseline reduced-motion fallback timing", () => {
	document.body.innerHTML = "";
	const previousSetTimeout = window.setTimeout;
	const delays: number[] = [];
	window.setTimeout = ((cb: TimerHandler, delay?: number) => {
		delays.push(Number(delay));
		if (typeof cb === "function") cb();
		return 1;
	}) as never;
	try {
		let done = false;
		const state = runLoginGuideParticles({ reduceMotion: true, done: () => { done = true; } });
		expect(state.started).toBe(false);
		expect(delays).toEqual([120]);
		expect(done).toBe(true);
	} finally {
		window.setTimeout = previousSetTimeout;
	}
});

test("createIdleGuideParticleField preserves baseline disabled flag and responsive particle counts", () => {
	expect(IDLE_GUIDE_BACKGROUND_ENABLED).toBe(false);
	expect(createIdleGuideParticleField({ width: 799, height: 600, random: () => 0.5 }).particles.length).toBe(150);
	expect(createIdleGuideParticleField({ width: 800, height: 600, random: () => 0.5 }).particles.length).toBe(240);
	const first = createIdleGuideParticleField({ width: 1024, height: 768, random: () => 0.5 }).particles[0];
	expect(first.ring).toBe(true);
	expect(first.cx).toBe(0.5);
	expect(first.cy).toBe(0.5);
	expect(Math.abs(first.size - (0.30 + 0.5 * 0.62))).toBeLessThan(0.000001);
});

test("projectIdleGuidePoint matches the baseline 3D idle-guide projection math", () => {
	const projected = projectIdleGuidePoint(12, -8, 30, {
		sx: Math.sin(-0.12),
		cx: Math.cos(-0.12),
		sy: Math.sin(0.35),
		cy: Math.cos(0.35),
	}, 400, 300, 520);

	const x1 = 12 * Math.cos(0.35) + 30 * Math.sin(0.35);
	const z1 = -12 * Math.sin(0.35) + 30 * Math.cos(0.35);
	const y1 = -8 * Math.cos(-0.12) - z1 * Math.sin(-0.12);
	const z2 = -8 * Math.sin(-0.12) + z1 * Math.cos(-0.12);
	const scale = Math.max(0.52, Math.min(1.74, 520 / (520 - z2 * 0.72)));
	expect(projected).toEqual({
		x: 400 + x1 * scale,
		y: 300 + y1 * scale,
		z: z2,
		scale,
	});
});
