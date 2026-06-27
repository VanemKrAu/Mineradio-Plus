import type {
	CinemaCamera,
	FocusZoneType,
	SetFocusZoneOptions,
	ShelfManager,
	ShelfMode,
} from "@mineradio/visual-engine";

export type ShelfFocusCameraMode = "static" | "dynamic";

export interface ShelfFocusZoneInput {
	pointerY: number;
	viewportHeight: number;
	queueFocusActive: boolean;
	shelfHasOpenContent: boolean;
	shelfCanFocus: boolean;
	sideShelfFocusHit: boolean;
	shelfMode: ShelfMode;
	splashActive: boolean;
	shelfCameraMode: ShelfFocusCameraMode;
	portrait: boolean;
	wallpaperSafe: boolean;
}

export interface ResolvedShelfFocusZone {
	type: FocusZoneType | null;
	immediate: boolean;
	portrait: boolean;
	wallpaperSafe: boolean;
}

export interface ShelfFocusPointerTarget {
	addEventListener(type: string, listener: EventListener): void;
	removeEventListener(type: string, listener: EventListener): void;
}

export interface ShelfFocusPointerWiringOptions {
	target: ShelfFocusPointerTarget;
	cinema: Pick<CinemaCamera, "setFocusZone">;
	shelfManager: Pick<ShelfManager, "getSnapshot" | "getData" | "getMode">;
	getSplashActive: () => boolean;
	getShelfCameraMode: () => string | null | undefined;
	getPortrait: () => boolean;
	getWallpaperSafe: () => boolean;
	getViewportHeight: () => number;
}

export function resolveShelfFocusZone(input: ShelfFocusZoneInput): ResolvedShelfFocusZone {
	const base = {
		portrait: input.portrait,
		wallpaperSafe: input.wallpaperSafe,
	};
	if (input.splashActive) {
		return { type: null, immediate: false, ...base };
	}
	if (input.queueFocusActive) {
		return { type: "queue", immediate: true, ...base };
	}
	if (input.shelfCameraMode === "static") {
		return { type: null, immediate: false, ...base };
	}
	if (input.shelfHasOpenContent) {
		return { type: "shelf-detail", immediate: false, ...base };
	}
	if (input.shelfCanFocus && input.sideShelfFocusHit) {
		return { type: "shelf-side", immediate: false, ...base };
	}
	if (
		input.shelfCanFocus &&
		input.shelfMode === "stage" &&
		Number.isFinite(input.pointerY) &&
		Number.isFinite(input.viewportHeight) &&
		input.pointerY > input.viewportHeight * 0.55
	) {
		return { type: "shelf-stage", immediate: false, ...base };
	}
	return { type: null, immediate: false, ...base };
}

export function isWallpaperSafeShelfPreset(preset: unknown): boolean {
	return Number(preset) === 5;
}

export function attachShelfFocusZonePointerWiring(opts: ShelfFocusPointerWiringOptions): () => void {
	let disposed = false;

	const applyResolvedFocus = (result: ResolvedShelfFocusZone): void => {
		if (disposed) return;
		const zoneOpts: SetFocusZoneOptions = {
			immediate: result.immediate,
			portrait: result.portrait,
			wallpaperSafe: result.wallpaperSafe,
		};
		opts.cinema.setFocusZone(result.type, zoneOpts);
	};

	const resolveFromPointer = (pointerY: number): ResolvedShelfFocusZone => {
		const mode = opts.shelfManager.getMode();
		const shelfCanFocus = opts.shelfManager.getData().length > 0 && mode !== "off";
		return resolveShelfFocusZone({
			pointerY,
			viewportHeight: opts.getViewportHeight(),
			queueFocusActive: false,
			shelfHasOpenContent: opts.shelfManager.getSnapshot().openCardIdx >= 0,
			shelfCanFocus,
			sideShelfFocusHit: false,
			shelfMode: mode,
			splashActive: opts.getSplashActive(),
			shelfCameraMode: normalizeShelfFocusCameraMode(opts.getShelfCameraMode()),
			portrait: opts.getPortrait(),
			wallpaperSafe: opts.getWallpaperSafe(),
		});
	};

	const onPointerMove: EventListener = (event) => {
		const pointer = event as PointerEvent;
		applyResolvedFocus(resolveFromPointer(pointer.clientY));
	};
	const onPointerLeave: EventListener = () => {
		// 离开全局窗口或窗口失焦时显式交还镜头，避免旧 focus 持续挂住。
		applyResolvedFocus({
			type: null,
			immediate: false,
			portrait: opts.getPortrait(),
			wallpaperSafe: opts.getWallpaperSafe(),
		});
	};

	opts.target.addEventListener("pointermove", onPointerMove);
	opts.target.addEventListener("pointerleave", onPointerLeave);
	opts.target.addEventListener("blur", onPointerLeave);

	return () => {
		disposed = true;
		opts.target.removeEventListener("pointermove", onPointerMove);
		opts.target.removeEventListener("pointerleave", onPointerLeave);
		opts.target.removeEventListener("blur", onPointerLeave);
	};
}

function normalizeShelfFocusCameraMode(value: string | null | undefined): ShelfFocusCameraMode {
	return value === "dynamic" ? "dynamic" : "static";
}
