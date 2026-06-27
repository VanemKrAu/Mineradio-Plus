import { expect, test } from "bun:test";
import {
	attachShelfFocusZonePointerWiring,
	isWallpaperSafeShelfPreset,
	resolveShelfFocusZone,
} from "./shelf-focus-zone";

const baseInput = {
	pointerY: 500,
	viewportHeight: 900,
	queueFocusActive: false,
	shelfHasOpenContent: false,
	shelfCanFocus: true,
	sideShelfFocusHit: false,
	shelfMode: "stage" as const,
	splashActive: false,
	shelfCameraMode: "dynamic" as const,
	portrait: false,
	wallpaperSafe: false,
};

test("isWallpaperSafeShelfPreset follows baseline preset 5 semantics", () => {
	expect(isWallpaperSafeShelfPreset(5)).toBe(true);
	expect(isWallpaperSafeShelfPreset("5")).toBe(true);
	expect(isWallpaperSafeShelfPreset(4)).toBe(false);
	expect(isWallpaperSafeShelfPreset(true)).toBe(false);
	expect(isWallpaperSafeShelfPreset(undefined)).toBe(false);
});

test("resolveShelfFocusZone returns null while splash is active", () => {
	expect(resolveShelfFocusZone({ ...baseInput, splashActive: true })).toEqual({
		type: null,
		immediate: false,
		portrait: false,
		wallpaperSafe: false,
	});
});

test("resolveShelfFocusZone gives queue focus priority and applies immediately", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		queueFocusActive: true,
		shelfHasOpenContent: true,
		sideShelfFocusHit: true,
	})).toEqual({
		type: "queue",
		immediate: true,
		portrait: false,
		wallpaperSafe: false,
	});
});

test("resolveShelfFocusZone keeps queue focus active when shelf camera mode is static", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		queueFocusActive: true,
		shelfCameraMode: "static",
	}).type).toBe("queue");
});

test("resolveShelfFocusZone clears shelf focus while shelf camera mode is static", () => {
	const shelfInputs = [
		{ shelfHasOpenContent: true },
		{ sideShelfFocusHit: true },
		{ shelfMode: "stage" as const, pointerY: 700 },
	];

	for (const overrides of shelfInputs) {
		expect(resolveShelfFocusZone({
			...baseInput,
			...overrides,
			shelfCameraMode: "static",
		}).type).toBeNull();
	}
});

test("resolveShelfFocusZone resolves shelf detail before side and stage focus", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		shelfHasOpenContent: true,
		sideShelfFocusHit: true,
		pointerY: 800,
	}).type).toBe("shelf-detail");
});

test("resolveShelfFocusZone resolves shelf side before stage focus", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		sideShelfFocusHit: true,
		pointerY: 800,
	}).type).toBe("shelf-side");
});

test("resolveShelfFocusZone resolves shelf stage only below the baseline threshold", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		pointerY: 495,
		viewportHeight: 900,
	}).type).toBeNull();
	expect(resolveShelfFocusZone({
		...baseInput,
		pointerY: 496,
		viewportHeight: 900,
	}).type).toBe("shelf-stage");
});

test("resolveShelfFocusZone returns null when shelf cannot focus or mode is off", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		pointerY: 800,
		shelfCanFocus: false,
	}).type).toBeNull();
	expect(resolveShelfFocusZone({
		...baseInput,
		pointerY: 800,
		shelfMode: "off",
	}).type).toBeNull();
});

test("resolveShelfFocusZone passes portrait and wallpaper-safe flags through", () => {
	expect(resolveShelfFocusZone({
		...baseInput,
		queueFocusActive: true,
		portrait: true,
		wallpaperSafe: true,
	})).toEqual({
		type: "queue",
		immediate: true,
		portrait: true,
		wallpaperSafe: true,
	});
});

class FakePointerTarget {
	listeners = new Map<string, Set<(event: { clientY: number }) => void>>();

	addEventListener(type: string, listener: EventListener): void {
		const set = this.listeners.get(type) ?? new Set<(event: { clientY: number }) => void>();
		set.add(listener as unknown as (event: { clientY: number }) => void);
		this.listeners.set(type, set);
	}

	removeEventListener(type: string, listener: EventListener): void {
		this.listeners.get(type)?.delete(listener as unknown as (event: { clientY: number }) => void);
	}

	emit(type: string, event: { clientY: number }): void {
		for (const listener of this.listeners.get(type) ?? []) {
			listener(event);
		}
	}

	count(type: string): number {
		return this.listeners.get(type)?.size ?? 0;
	}
}

test("attachShelfFocusZonePointerWiring calls cinema focus from global pointer movement and removes listeners on cleanup", () => {
	const target = new FakePointerTarget();
	const calls: unknown[] = [];
	const cleanup = attachShelfFocusZonePointerWiring({
		target,
		cinema: {
			setFocusZone: (type, opts) => calls.push([type, opts]),
		},
		shelfManager: {
			getSnapshot: () => ({
				centerIdx: 0,
				centerSmooth: 0,
				mode: "stage",
				shelfPane: "mine",
				shelfVisibility: 1,
				openCardIdx: -1,
				breathPulse: 0,
			}),
			getData: () => [{ title: "Queued track" }],
			getMode: () => "stage",
		},
		getSplashActive: () => false,
		getShelfCameraMode: () => "dynamic",
		getPortrait: () => true,
		getWallpaperSafe: () => false,
		getViewportHeight: () => 900,
	});

	expect(target.count("pointermove")).toBe(1);
	expect(target.count("pointerleave")).toBe(1);
	expect(target.count("blur")).toBe(1);

	target.emit("pointermove", { clientY: 700 });
	target.emit("pointerleave", { clientY: 0 });
	target.emit("blur", { clientY: 0 });
	cleanup();
	target.emit("pointermove", { clientY: 700 });
	target.emit("blur", { clientY: 0 });

	expect(calls).toEqual([
		["shelf-stage", { immediate: false, portrait: true, wallpaperSafe: false }],
		[null, { immediate: false, portrait: true, wallpaperSafe: false }],
		[null, { immediate: false, portrait: true, wallpaperSafe: false }],
	]);
	expect(target.count("pointermove")).toBe(0);
	expect(target.count("pointerleave")).toBe(0);
	expect(target.count("blur")).toBe(0);
});
