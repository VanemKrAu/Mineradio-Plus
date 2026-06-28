export type ShelfSelectSoundVariant = "card" | "row";

export interface ShelfSelectSoundPlayer {
	play(direction: number, variant?: ShelfSelectSoundVariant): boolean;
}

export interface ShelfSelectSoundPlayerOptions {
	audioContext?: AudioContext | null;
	window?: ShelfSelectSoundWindowLike | null;
	now?: () => number;
	volume?: () => number;
	random?: () => number;
}

type AudioContextCtor = new () => AudioContext;

export interface ShelfSelectSoundWindowLike {
	AudioContext?: AudioContextCtor;
	webkitAudioContext?: AudioContextCtor;
}

export function createShelfSelectSoundPlayer(opts: ShelfSelectSoundPlayerOptions = {}): ShelfSelectSoundPlayer {
	const win = opts.window ?? (typeof window !== "undefined" ? (window as unknown as ShelfSelectSoundWindowLike) : null);
	const nowFn = opts.now ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
	const volumeFn = opts.volume ?? (() => 0.65);
	const randomFn = opts.random ?? Math.random;
	let ctx = opts.audioContext ?? null;
	let lastAt = -Infinity;

	function resolveCtor(): AudioContextCtor | null {
		return win?.AudioContext ?? win?.webkitAudioContext ?? null;
	}

	function ensureContext(): AudioContext | null {
		if (ctx) return ctx;
		const Ctor = resolveCtor();
		if (!Ctor) return null;
		ctx = new Ctor();
		return ctx;
	}

	function play(direction: number, variant: ShelfSelectSoundVariant = "card"): boolean {
		const nowMs = nowFn();
		const minGap = variant === "row" ? 36 : 42;
		if (nowMs - lastAt < minGap) return false;
		const audioCtx = ensureContext();
		if (!audioCtx) return false;
		if (audioCtx.state === "suspended" && typeof audioCtx.resume === "function") {
			audioCtx.resume().catch(() => {});
		}
		lastAt = nowMs;
		scheduleShelfSelectTick(audioCtx, direction, variant, volumeFn(), randomFn);
		return true;
	}

	return { play };
}

function clamp01(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(1, value));
}

function scheduleShelfSelectTick(
	ctx: AudioContext,
	direction: number,
	variant: ShelfSelectSoundVariant,
	volume: number,
	random: () => number,
): void {
	const dir = direction < 0 ? -1 : 1;
	const pitch = dir > 0 ? 1.035 : 0.965;
	const rowScale = variant === "row" ? 0.74 : 1.0;
	const volumeScale = 0.38 + clamp01(volume == null ? 0.65 : volume) * 0.62;
	const t = ctx.currentTime + 0.002;
	const out = ctx.createGain();
	out.gain.setValueAtTime(0.0001, t);
	out.gain.linearRampToValueAtTime(0.058 * rowScale * volumeScale, t + 0.002);
	out.gain.exponentialRampToValueAtTime(0.0001, t + 0.082);
	out.connect(ctx.destination);

	const sampleRate = ctx.sampleRate || 44100;
	const len = Math.max(1, Math.floor(sampleRate * 0.034));
	const buf = ctx.createBuffer(1, len, sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < len; i++) {
		const e = Math.pow(1 - i / len, 4.2);
		data[i] = (random() * 2 - 1) * e;
	}
	const noise = ctx.createBufferSource();
	noise.buffer = buf;
	const hp = ctx.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.setValueAtTime(4200 * pitch, t);
	const bp = ctx.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.setValueAtTime(8400 * pitch, t);
	bp.Q.setValueAtTime(7.2, t);
	const ng = ctx.createGain();
	ng.gain.setValueAtTime(0.56, t);
	noise.connect(hp);
	hp.connect(bp);
	bp.connect(ng);
	ng.connect(out);
	noise.start(t);
	noise.stop(t + 0.040);

	function clickOsc(type: OscillatorType, freq: number, delay: number, dur: number, gainValue: number, bend: number): void {
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		const start = t + delay;
		const end = start + dur;
		osc.type = type;
		osc.frequency.setValueAtTime(freq * pitch, start);
		osc.frequency.exponentialRampToValueAtTime(freq * pitch * bend, end);
		g.gain.setValueAtTime(0.0001, start);
		g.gain.linearRampToValueAtTime(gainValue, start + 0.002);
		g.gain.exponentialRampToValueAtTime(0.0001, end);
		osc.connect(g);
		g.connect(out);
		osc.start(start);
		osc.stop(end + 0.004);
	}

	clickOsc("triangle", 720, 0.000, 0.030, 0.18, 0.70);
	clickOsc("square", 2180, 0.004, 0.022, 0.30, 0.86);
	clickOsc("triangle", 4200, 0.011, 0.018, 0.18, 0.94);
	clickOsc("square", 7100, 0.018, 0.012, 0.070, 0.98);
}
