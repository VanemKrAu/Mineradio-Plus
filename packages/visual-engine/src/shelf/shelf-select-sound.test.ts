import { expect, test } from "bun:test";
import { createShelfSelectSoundPlayer } from "./shelf-select-sound";

interface FakeAudioParam {
	events: string[];
	setValueAtTime(v: number, t: number): FakeAudioParam;
	exponentialRampToValueAtTime(v: number, t: number): FakeAudioParam;
	linearRampToValueAtTime(v: number, t: number): FakeAudioParam;
}

function fakeParam(): FakeAudioParam {
	const param: FakeAudioParam = {
		events: [],
		setValueAtTime(v, t) {
			param.events.push(`set@${t.toFixed(3)}=${v}`);
			return param;
		},
		exponentialRampToValueAtTime(v, t) {
			param.events.push(`exp@${t.toFixed(3)}=${v}`);
			return param;
		},
		linearRampToValueAtTime(v, t) {
			param.events.push(`lin@${t.toFixed(3)}=${v}`);
			return param;
		},
	};
	return param;
}

interface FakeNode {
	connect(target: FakeNode | { kind: "destination" }): void;
	startTimes: number[];
	stopTimes: number[];
}

interface FakeGain extends FakeNode {
	kind: "gain";
	gain: FakeAudioParam;
}

interface FakeOscillator extends FakeNode {
	kind: "oscillator";
	type: string;
	frequency: FakeAudioParam;
	start(t: number): void;
	stop(t: number): void;
}

interface FakeSource extends FakeNode {
	kind: "source";
	buffer: unknown;
	start(t: number): void;
	stop(t: number): void;
}

interface FakeBiquad extends FakeNode {
	kind: "biquad";
	type: string;
	frequency: FakeAudioParam;
	Q: FakeAudioParam;
}

interface FakeAudioContext {
	state: "running" | "suspended";
	currentTime: number;
	sampleRate: number;
	destination: { kind: "destination" };
	gains: FakeGain[];
	oscillators: FakeOscillator[];
	sources: FakeSource[];
	biquads: FakeBiquad[];
	buffers: Array<{ channels: number; length: number; sampleRate: number }>;
	createGain(): FakeGain;
	createOscillator(): FakeOscillator;
	createBufferSource(): FakeSource;
	createBiquadFilter(): FakeBiquad;
	createBuffer(channels: number, length: number, sampleRate: number): { getChannelData(): Float32Array };
	resume(): Promise<void>;
}

function makeFakeContext(): FakeAudioContext {
	const ctx: FakeAudioContext = {
		state: "running",
		currentTime: 10,
		sampleRate: 44100,
		destination: { kind: "destination" },
		gains: [],
		oscillators: [],
		sources: [],
		biquads: [],
		buffers: [],
		createGain() {
			const gain: FakeGain = {
				kind: "gain",
				gain: fakeParam(),
				startTimes: [],
				stopTimes: [],
				connect() {},
			};
			ctx.gains.push(gain);
			return gain;
		},
		createOscillator() {
			const osc: FakeOscillator = {
				kind: "oscillator",
				type: "sine",
				frequency: fakeParam(),
				startTimes: [],
				stopTimes: [],
				connect() {},
				start(t) {
					osc.startTimes.push(t);
				},
				stop(t) {
					osc.stopTimes.push(t);
				},
			};
			ctx.oscillators.push(osc);
			return osc;
		},
		createBufferSource() {
			const source: FakeSource = {
				kind: "source",
				buffer: null,
				startTimes: [],
				stopTimes: [],
				connect() {},
				start(t) {
					source.startTimes.push(t);
				},
				stop(t) {
					source.stopTimes.push(t);
				},
			};
			ctx.sources.push(source);
			return source;
		},
		createBiquadFilter() {
			const biquad: FakeBiquad = {
				kind: "biquad",
				type: "",
				frequency: fakeParam(),
				Q: fakeParam(),
				startTimes: [],
				stopTimes: [],
				connect() {},
			};
			ctx.biquads.push(biquad);
			return biquad;
		},
		createBuffer(channels, length, sampleRate) {
			ctx.buffers.push({ channels, length, sampleRate });
			return { getChannelData: () => new Float32Array(length) };
		},
		resume() {
			return Promise.resolve();
		},
	};
	return ctx;
}

test("createShelfSelectSoundPlayer schedules baseline mechanical card tick graph", () => {
	const ctx = makeFakeContext();
	const player = createShelfSelectSoundPlayer({
		audioContext: ctx as unknown as AudioContext,
		now: () => 1000,
		volume: () => 0.65,
	});

	expect(player.play(1, "card")).toBe(true);

	expect(ctx.buffers).toEqual([{ channels: 1, length: Math.floor(44100 * 0.034), sampleRate: 44100 }]);
	expect(ctx.sources).toHaveLength(1);
	expect(ctx.biquads.map((b) => b.type)).toEqual(["highpass", "bandpass"]);
	expect(ctx.oscillators.map((o) => o.type)).toEqual(["triangle", "square", "triangle", "square"]);
	const oscStarts = ctx.oscillators.map((o) => {
		const match = /^set@([0-9.]+)=([0-9.]+)$/.exec(o.frequency.events[0] ?? "");
		return { time: Number(match?.[1]), frequency: Number(match?.[2]) };
	});
	expect(oscStarts.map((s) => s.time)).toEqual([10.002, 10.006, 10.013, 10.02]);
	expect(oscStarts.map((s) => s.frequency)).toEqual([
		expect.closeTo(720 * 1.035, 6),
		expect.closeTo(2180 * 1.035, 6),
		expect.closeTo(4200 * 1.035, 6),
		expect.closeTo(7100 * 1.035, 6),
	]);
	expect(ctx.gains[0]?.gain.events).toEqual([
		"set@10.002=0.0001",
		"lin@10.004=0.045414",
		"exp@10.084=0.0001",
	]);
});

test("createShelfSelectSoundPlayer rate-limits card and row ticks with baseline gaps", () => {
	const ctx = makeFakeContext();
	let now = 1000;
	const player = createShelfSelectSoundPlayer({
		audioContext: ctx as unknown as AudioContext,
		now: () => now,
		volume: () => 1,
	});

	expect(player.play(1, "card")).toBe(true);
	now += 41;
	expect(player.play(1, "card")).toBe(false);
	now += 1;
	expect(player.play(1, "card")).toBe(true);
	now += 35;
	expect(player.play(-1, "row")).toBe(false);
	now += 1;
	expect(player.play(-1, "row")).toBe(true);

	expect(ctx.sources).toHaveLength(3);
});
