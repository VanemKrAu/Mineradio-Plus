import { expect, test } from "bun:test";
import type { AudioSnapshot } from "../audio/audio-snapshot";
import type { FrameContext } from "../runtime/frame-context";
import type { RuntimeUniforms } from "../runtime/uniforms";
import type { ThreeFactory } from "../runtime/renderer-setup";
import { cloneFxState } from "./fx-defaults";
import {
	createSkullParticleController,
	SKULL_MODEL_BASE_ROTATION_X,
	SKULL_MODEL_BASE_ROTATION_Y,
	SKULL_MODEL_SCALE,
	SKULL_PARTICLE_VERTEX_SHADER,
} from "./skull-particles";

function makeFakeThree(): ThreeFactory {
	const Points = function (geo: unknown, mat: unknown) {
		return {
			isPoints: true,
			geometry: geo,
			material: mat,
			frustumCulled: true,
			renderOrder: 0,
			visible: true,
			userData: {} as Record<string, unknown>,
			position: {
				x: 0, y: 0, z: 0,
				set(this: { x: number; y: number; z: number }, x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; },
			},
			scale: {
				x: 1, y: 1, z: 1,
				setScalar(this: { x: number; y: number; z: number }, s: number) { this.x = s; this.y = s; this.z = s; },
			},
			rotation: {
				x: 0, y: 0, z: 0,
				set(this: { x: number; y: number; z: number }, x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; },
			},
			updateMatrixWorld() {},
		};
	} as never;
	const ShaderMaterial = function (params: Record<string, unknown>) {
		return {
			uniforms: params.uniforms,
			vertexShader: params.vertexShader,
			fragmentShader: params.fragmentShader,
			transparent: params.transparent,
			depthWrite: params.depthWrite,
			depthTest: params.depthTest,
			blending: params.blending,
			dispose() {},
		};
	} as never;
	const BufferAttribute = function (arr: Float32Array, itemSize: number) {
		return { array: arr, itemSize, count: arr.length / itemSize, needsUpdate: false };
	} as never;
	const BufferGeometry = function () {
		return {
			attributes: {} as Record<string, unknown>,
			setAttribute(name: string, attr: unknown) { this.attributes[name] = attr; },
			dispose() {},
		};
	} as never;
	const Color = function (hex: string) {
		return { hex, copy() { return this; }, lerp() { return this; } };
	} as never;
	const module = {
		Points,
		ShaderMaterial,
		BufferAttribute,
		BufferGeometry,
		Color,
		NormalBlending: 1,
	};
	return (() => module) as unknown as ThreeFactory;
}

function makeFakeScene() {
	const added: unknown[] = [];
	const removed: unknown[] = [];
	return {
		add(o: unknown) { added.push(o); },
		remove(o: unknown) { removed.push(o); },
		added,
		removed,
	};
}

function makeUniforms(): Record<string, { value: unknown }> {
	return {
		uDotTex: { value: null },
		uTime: { value: 0 },
		uPixel: { value: 1 },
		uBass: { value: 0 },
		uMid: { value: 0 },
		uTreble: { value: 0 },
		uBeat: { value: 0 },
		uPointScale: { value: 1 },
		uBloomStrength: { value: 0 },
		uColorBoost: { value: 1 },
	};
}

function makeFrame(snapshotPatch: Partial<AudioSnapshot> = {}): FrameContext {
	const snapshot: AudioSnapshot = {
		bass: 0,
		mid: 0,
		treble: 0,
		energy: 0,
		rb: 0,
		rm: 0,
		rt: 0,
		re: 0,
		beatPulse: 0,
		scheduledBeatPulse: 0,
		beatOnsetFlag: false,
		...snapshotPatch,
	};
	const uniforms: RuntimeUniforms = {
		uTime: { value: 0 },
		uBass: { value: 0 },
		uMid: { value: 0 },
		uTreble: { value: 0 },
		uBeat: { value: 0 },
		uEnergy: { value: 0 },
		uMouseXY: { value: { x: 0, y: 0 } as never },
		uMouseActive: { value: 0 },
		uVinylSpin: { value: 0 },
		uParticleDim: { value: 1 },
		uBurstAmt: { value: 0 },
	};
	return {
		dt: 1,
		now: 0,
		snapshot,
		uniforms,
		scene: {} as never,
		camera: {} as never,
		pointerParallax: { x: 0, y: 0 },
		pointerTarget: { x: 0, y: 0 },
	};
}

test("skull vertex shader preserves baseline jaw side-pull, fallback jaw and dental lighting terms", () => {
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("float jawSidePull = jawGroup * smoothstep(-0.42, -1.06, position.y)");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("pos.x *= 1.0 - jawSidePull * 0.10;");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("float fallbackJaw = smoothstep(-0.48, -0.90, position.y)");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("vec3 lowDir = normalize(vec3(-0.10, -0.78, 0.34));");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("vec3 fillDir = normalize(vec3(0.36, -0.04, 0.64));");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("float low = pow(max(dot(vn, lowDir), 0.0), 1.34) * 0.10;");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("float fill = max(dot(vn, fillDir), 0.0) * 0.055;");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("float dentalLift = smoothstep(0.48, 0.72, position.z)");
	expect(SKULL_PARTICLE_VERTEX_SHADER).toContain("low + fill + dentalLift * 0.20 + boneKind * 0.070");
});

test("skull update applies baseline wheel zoom, head parallax and gesture rotation suppliers", async () => {
	const scene = makeFakeScene();
	const controller = await createSkullParticleController({
		scene: scene as never,
		threeFactory: makeFakeThree(),
		uniforms: makeUniforms() as never,
		assetData: new Float32Array([0, 0, 0, 1, 42]),
		wheelZoomSupplier: () => 1.28,
		headParallaxSupplier: () => ({ active: true, x: 0.2, y: -0.1 }),
		gestureRotationSupplier: () => ({ x: 0.3, y: -0.4 }),
		orbitCenterLockedSupplier: () => false,
	} as never);
	const fx = cloneFxState();
	fx.preset = 6;

	controller.update(makeFrame(), fx);

	const skull = controller.getObject() as unknown as {
		scale: { x: number; y: number; z: number };
		rotation: { x: number; y: number; z: number };
	};
	expect(skull.scale.x).toBeCloseTo(SKULL_MODEL_SCALE * (1 - 1.28 * 0.055), 6);
	expect(skull.scale.y).toBe(skull.scale.x);
	expect(skull.scale.z).toBe(skull.scale.x);
	expect(skull.rotation.y).toBeCloseTo(SKULL_MODEL_BASE_ROTATION_Y + 0.2 * 0.5 - 0.4, 6);
	expect(skull.rotation.x).toBeCloseTo(SKULL_MODEL_BASE_ROTATION_X + 0.1 * 0.35 + 0.3, 6);
});

test("skull update suppresses parallax and gesture rotation when orbit is center locked", async () => {
	const scene = makeFakeScene();
	const controller = await createSkullParticleController({
		scene: scene as never,
		threeFactory: makeFakeThree(),
		uniforms: makeUniforms() as never,
		assetData: new Float32Array([0, 0, 0, 1, 42]),
		wheelZoomSupplier: () => 0,
		headParallaxSupplier: () => ({ active: true, x: 0.2, y: -0.1 }),
		gestureRotationSupplier: () => ({ x: 0.3, y: -0.4 }),
		orbitCenterLockedSupplier: () => true,
	} as never);
	const fx = cloneFxState();
	fx.preset = 6;

	controller.update(makeFrame(), fx);

	const skull = controller.getObject() as unknown as { rotation: { x: number; y: number } };
	expect(skull.rotation.y).toBeCloseTo(SKULL_MODEL_BASE_ROTATION_Y, 6);
	expect(skull.rotation.x).toBeCloseTo(SKULL_MODEL_BASE_ROTATION_X, 6);
});
