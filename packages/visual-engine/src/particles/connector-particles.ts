import type * as THREE from "three";
import type { ThreeFactory, ThreeModule } from "../runtime/renderer-setup";
import type { FrameContext } from "../runtime/frame-context";

export const CONNECTOR_PARTICLE_COUNT = 80;

export interface ConnectorParticlesOptions {
	scene: THREE.Scene;
	threeFactory?: ThreeFactory;
	pixelScale?: number;
	dotTexture?: THREE.Texture | null;
}

export interface ConnectorParticles {
	readonly object: THREE.Points | null;
	readonly floorMirror?: THREE.Mesh | null;
	update(ctx: FrameContext): void;
	setIntensity(value: number): void;
	setTrackScale(value: number): void;
	reset(seed?: number): void;
	dispose(): void;
}

const DEFAULT_THREE_FACTORY: ThreeFactory = async () => await import("three");

const CONNECTOR_VERTEX_SHADER = `
precision highp float;
uniform float uTime, uPixel;
attribute vec3 aColor;
attribute float aRand;
varying vec3 vC;
varying float vA;
void main(){
	vec3 p = position;
	p.x += sin(uTime * 0.4 + aRand * 6.0) * 1.5;
	p.y += sin(uTime * 0.6 + aRand * 4.0) * 0.2;
	p.z += cos(uTime * 0.5 + aRand * 5.0) * 0.4;
	vC = aColor; vA = 0.4 + 0.4 * sin(uTime * 1.5 + aRand * 7.0);
	vec4 m = modelViewMatrix * vec4(p, 1.0);
	gl_PointSize = 4.0 * uPixel;
	gl_Position = projectionMatrix * m;
}
`;

const CONNECTOR_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uDotTex;
varying vec3 vC;
varying float vA;
void main(){
	vec4 t = texture2D(uDotTex, gl_PointCoord);
	if (t.a < 0.02) discard;
	gl_FragColor = vec4(vC, t.a * vA);
}
`;

type UniformsRecord = {
	uTime: THREE.IUniform<number>;
	uPixel: THREE.IUniform<number>;
	uDotTex: THREE.IUniform<THREE.Texture | null>;
};

function buildGeometry(THREE: ThreeModule, count: number): THREE.BufferGeometry {
	const positions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);
	const rands = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 6;
		positions[i * 3 + 1] = (Math.random() - 0.5) * 1.2 + 0.3;
		positions[i * 3 + 2] = 1.0 + Math.random() * 1.5;
		colors[i * 3] = 0.56;
		colors[i * 3 + 1] = 0.91;
		colors[i * 3 + 2] = 1.0;
		rands[i] = Math.random();
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
	geo.setAttribute("aRand", new THREE.BufferAttribute(rands, 1));
	return geo;
}

function createDotTexture(THREE: ThreeModule): THREE.Texture | null {
	if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
	const canvas = document.createElement("canvas");
	canvas.width = 32;
	canvas.height = 32;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
	gradient.addColorStop(0, "rgba(255,255,255,1)");
	gradient.addColorStop(0.48, "rgba(255,255,255,0.82)");
	gradient.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 32, 32);
	const texture = new THREE.CanvasTexture(canvas);
	texture.generateMipmaps = false;
	return texture;
}

function createFloorMirror(THREE: ThreeModule): THREE.Mesh | null {
	let texture: THREE.Texture | null = null;
	if (typeof document !== "undefined" && typeof document.createElement === "function") {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 64;
		const ctx = canvas.getContext("2d");
		if (ctx) {
			const gradient = ctx.createLinearGradient(0, 0, 0, 64);
			gradient.addColorStop(0, "rgba(255,255,255,0.07)");
			gradient.addColorStop(1, "rgba(255,255,255,0)");
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, 256, 64);
			texture = new THREE.CanvasTexture(canvas);
			texture.generateMipmaps = false;
		}
	}
	const material = new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		depthWrite: false,
		opacity: 0.55,
	});
	const mirror = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.8), material);
	mirror.position.set(0, -2.85, 0.4);
	mirror.rotation.x = -Math.PI / 2;
	return mirror;
}

export async function createConnectorParticles(
	opts: ConnectorParticlesOptions,
): Promise<ConnectorParticles> {
	const factory = opts.threeFactory ?? DEFAULT_THREE_FACTORY;
	const THREE = await factory();
	const pixelScale = opts.pixelScale ?? 1;
	const geo = buildGeometry(THREE, CONNECTOR_PARTICLE_COUNT);
	const dotTexture = opts.dotTexture ?? createDotTexture(THREE);
	const ownsDotTexture = !opts.dotTexture && !!dotTexture;
	const uniforms: UniformsRecord = {
		uTime: { value: 0 },
		uPixel: { value: pixelScale },
		uDotTex: { value: dotTexture },
	};
	const material = new THREE.ShaderMaterial({
		uniforms,
		vertexShader: CONNECTOR_VERTEX_SHADER,
		fragmentShader: CONNECTOR_FRAGMENT_SHADER,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});
	const points = new THREE.Points(geo, material);
	points.frustumCulled = false;
	points.renderOrder = 49;
	points.visible = false;
	points.position.set(0, -2.2, 0);
	opts.scene.add(points);
	const floorMirror = createFloorMirror(THREE);
	if (floorMirror) {
		floorMirror.visible = false;
		opts.scene.add(floorMirror);
	}

	return {
		object: points,
		floorMirror,
		update(ctx) {
			uniforms.uTime.value = ctx.uniforms.uTime.value;
		},
		setIntensity(value) {
			void value;
		},
		setTrackScale(value) {
			void value;
		},
		reset(seed) {
			void seed;
			const posAttr = geo.attributes.position as unknown as THREE.BufferAttribute;
			const colorAttr = geo.attributes.aColor as unknown as THREE.BufferAttribute;
			const randAttr = geo.attributes.aRand as unknown as THREE.BufferAttribute;
			const positions = posAttr.array as Float32Array;
			const colors = colorAttr.array as Float32Array;
			const rands = randAttr.array as Float32Array;
			for (let i = 0; i < CONNECTOR_PARTICLE_COUNT; i++) {
				positions[i * 3] = (Math.random() - 0.5) * 6;
				positions[i * 3 + 1] = (Math.random() - 0.5) * 1.2 + 0.3;
				positions[i * 3 + 2] = 1.0 + Math.random() * 1.5;
				colors[i * 3] = 0.56;
				colors[i * 3 + 1] = 0.91;
				colors[i * 3 + 2] = 1.0;
				rands[i] = Math.random();
			}
			posAttr.needsUpdate = true;
			colorAttr.needsUpdate = true;
			randAttr.needsUpdate = true;
		},
		dispose() {
			opts.scene.remove(points);
			if (floorMirror) {
				opts.scene.remove(floorMirror);
				;(floorMirror.geometry as THREE.BufferGeometry | undefined)?.dispose?.();
				const mat = floorMirror.material;
				if (Array.isArray(mat)) {
					for (const m of mat) {
						;(m as THREE.MeshBasicMaterial).map?.dispose();
						m.dispose();
					}
				} else {
					;(mat as THREE.MeshBasicMaterial).map?.dispose();
					mat.dispose();
				}
			}
			if (ownsDotTexture) dotTexture?.dispose();
			geo.dispose();
			material.dispose();
			;(this as { object: THREE.Points | null }).object = null;
			;(this as { floorMirror: THREE.Mesh | null }).floorMirror = null;
		},
	};
}
