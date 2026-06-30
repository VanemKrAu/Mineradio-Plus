export const IDLE_GUIDE_BACKGROUND_ENABLED = false;

export interface LoginGuideParticleState {
	started: boolean;
	particleCount: number;
}

export interface LoginGuideParticleOptions {
	canvas?: HTMLCanvasElement | null;
	reduceMotion?: boolean;
	done?: () => void;
	now?: () => number;
	random?: () => number;
	doc?: Document;
	win?: Window;
}

interface LoginParticle {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	r: number;
	delay: number;
	hue: number;
	spin: number;
}

export interface IdleGuideParticle {
	a: number;
	r: number;
	cx: number;
	cy: number;
	size: number;
	speed: number;
	phase: number;
	wobbleAmp: number;
	wobbleSpeed: number;
	oval: number;
	zAmp: number;
	driftX: number;
	driftY: number;
	layer: number;
	z: number;
	ring: boolean;
}

export interface IdleGuideParticleField {
	width: number;
	height: number;
	particles: IdleGuideParticle[];
}

export interface IdleGuideProjectionRotation {
	sx: number;
	cx: number;
	sy: number;
	cy: number;
}

let loginGuideAnimating = false;
let loginGuideRaf: number | null = null;

function getWindow(input?: Window): Window | null {
	if (input) return input;
	return typeof window === "undefined" ? null : window;
}

function getDocument(input?: Document): Document | null {
	if (input) return input;
	return typeof document === "undefined" ? null : document;
}

function fallbackDone(win: Window | null, done?: () => void, delay = 120): void {
	if (!done) return;
	const timer = win?.setTimeout ?? setTimeout;
	timer(done, delay);
}

export function runLoginGuideParticles(opts: LoginGuideParticleOptions = {}): LoginGuideParticleState {
	const win = getWindow(opts.win);
	const doc = getDocument(opts.doc);
	const canvas = opts.canvas ?? (doc?.getElementById("login-guide-canvas") as HTMLCanvasElement | null);
	const reduced = opts.reduceMotion === true;
	if (!win || !doc || !canvas || reduced) {
		fallbackDone(win, opts.done, 120);
		return { started: false, particleCount: 0 };
	}
	if (loginGuideAnimating) {
		fallbackDone(win, opts.done, 720);
		return { started: false, particleCount: 0 };
	}
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		fallbackDone(win, opts.done, 120);
		return { started: false, particleCount: 0 };
	}

	const random = opts.random ?? Math.random;
	loginGuideAnimating = true;
	doc.body.classList.add("login-guide-active");
	const dpr = Math.min(win.devicePixelRatio || 1, 1.8);
	const w = win.innerWidth;
	const h = win.innerHeight;
	canvas.width = Math.floor(w * dpr);
	canvas.height = Math.floor(h * dpr);
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

	const cx = w * 0.5;
	const cy = h * 0.5 - 10;
	const maxR = Math.max(w, h);
	const particles: LoginParticle[] = [];
	for (let i = 0; i < 92; i += 1) {
		const ang = random() * Math.PI * 2;
		const ring = maxR * (0.30 + random() * 0.35);
		const arcBias = random() < 0.42 ? Math.PI * 0.5 : 0;
		particles.push({
			sx: cx + Math.cos(ang + arcBias) * ring + (random() - 0.5) * 80,
			sy: cy + Math.sin(ang) * ring * 0.72 + (random() - 0.5) * 80,
			tx: cx + (random() - 0.5) * 172,
			ty: cy + (random() - 0.5) * 172,
			r: 0.8 + random() * 1.9,
			delay: random() * 0.22,
			hue: random(),
			spin: random() * Math.PI * 2,
		});
	}

	const started = opts.now?.() ?? (typeof performance !== "undefined" ? performance.now() : Date.now());
	const duration = 1050;
	if (loginGuideRaf != null) win.cancelAnimationFrame(loginGuideRaf);

	const finish = () => {
		ctx.clearRect(0, 0, w, h);
		doc.body.classList.remove("login-guide-active");
		loginGuideAnimating = false;
		loginGuideRaf = null;
		opts.done?.();
	};

	const draw = (frameNow: number) => {
		const raw = Math.max(0, Math.min(1, (frameNow - started) / duration));
		ctx.clearRect(0, 0, w, h);
		ctx.globalCompositeOperation = "lighter";
		const centerPulse = Math.sin(Math.PI * raw);
		const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.28);
		halo.addColorStop(0, `rgba(255,255,255,${0.060 * centerPulse})`);
		halo.addColorStop(0.55, `rgba(255,255,255,${0.026 * centerPulse})`);
		halo.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = halo;
		ctx.fillRect(0, 0, w, h);

		for (const p of particles) {
			const lt = Math.max(0, Math.min(1, (raw - p.delay) / (1 - p.delay)));
			const e = 1 - Math.pow(1 - lt, 3);
			const wobble = Math.sin(lt * Math.PI * 2 + p.spin) * (1 - lt) * 18;
			const x = p.sx + (p.tx - p.sx) * e + Math.cos(p.spin) * wobble;
			const y = p.sy + (p.ty - p.sy) * e + Math.sin(p.spin) * wobble * 0.6;
			const alpha = Math.sin(Math.PI * lt) * (0.18 + p.hue * 0.18);
			if (alpha <= 0) continue;
			ctx.beginPath();
			ctx.arc(x, y, p.r * (0.75 + lt * 0.45), 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255,255,255,${alpha})`;
			ctx.fill();
			if (lt > 0.08 && lt < 0.92) {
				const tx = p.sx + (p.tx - p.sx) * Math.max(0, e - 0.045);
				const ty = p.sy + (p.ty - p.sy) * Math.max(0, e - 0.045);
				ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.20})`;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(tx, ty);
				ctx.lineTo(x, y);
				ctx.stroke();
			}
		}

		if (raw < 1) {
			loginGuideRaf = win.requestAnimationFrame(draw);
			return;
		}
		const gsap = (win as Window & { gsap?: { to?: (target: unknown, vars: { opacity: number; duration: number; ease: string; onComplete: () => void }) => void; set?: (target: unknown, vars: { clearProps: string }) => void } }).gsap;
		if (gsap?.to) {
			gsap.to(canvas, {
				opacity: 0,
				duration: 0.28,
				ease: "power2.out",
				onComplete: () => {
					finish();
					gsap.set?.(canvas, { clearProps: "opacity" });
				},
			});
		} else {
			finish();
		}
	};

	loginGuideRaf = win.requestAnimationFrame(draw);
	return { started: true, particleCount: particles.length };
}

export function createIdleGuideParticleField(input: {
	width: number;
	height: number;
	random?: () => number;
}): IdleGuideParticleField {
	const idleGuideW = Math.max(1, input.width);
	const idleGuideH = Math.max(1, input.height);
	const random = input.random ?? Math.random;
	const minDim = Math.min(idleGuideW, idleGuideH);
	const maxDim = Math.max(idleGuideW, idleGuideH);
	const count = idleGuideW < 800 ? 150 : 240;
	const particles: IdleGuideParticle[] = [];
	for (let i = 0; i < count; i += 1) {
		const ring = i < count * 0.76;
		const a = random() * Math.PI * 2;
		const r = ring
			? (minDim * 0.035 + Math.pow(random(), 0.58) * minDim * 0.335)
			: (Math.pow(random(), 0.82) * maxDim * 0.58);
		const wobbleAmp = minDim * (ring ? (0.012 + random() * 0.035) : (0.010 + random() * 0.055));
		particles.push({
			a,
			r,
			cx: ring ? 0.5 : random(),
			cy: ring ? 0.5 : random(),
			size: ring ? (0.30 + random() * 0.62) : (0.18 + random() * 0.44),
			speed: ((ring ? 0.018 : 0.010) + random() * (ring ? 0.045 : 0.030)) * (random() < 0.5 ? -1 : 1),
			phase: random() * Math.PI * 2,
			wobbleAmp,
			wobbleSpeed: 0.18 + random() * 0.76,
			oval: 0.56 + random() * 0.36,
			zAmp: 0.34 + random() * 0.82,
			driftX: (random() * 2 - 1) * wobbleAmp * 0.75,
			driftY: (random() * 2 - 1) * wobbleAmp * 0.75,
			layer: random(),
			z: (random() * 2 - 1) * (ring ? minDim * 0.28 : maxDim * 0.42),
			ring,
		});
	}
	return { width: idleGuideW, height: idleGuideH, particles };
}

export function projectIdleGuidePoint(
	x: number,
	y: number,
	z: number,
	rot: IdleGuideProjectionRotation,
	cx: number,
	cy: number,
	depth: number,
): { x: number; y: number; z: number; scale: number } {
	const x1 = x * rot.cy + z * rot.sy;
	const z1 = -x * rot.sy + z * rot.cy;
	const y1 = y * rot.cx - z1 * rot.sx;
	const z2 = y * rot.sx + z1 * rot.cx;
	let scale = depth / (depth - z2 * 0.72);
	scale = Math.max(0.52, Math.min(1.74, scale));
	return {
		x: cx + x1 * scale,
		y: cy + y1 * scale,
		z: z2,
		scale,
	};
}

export interface IdleGuideCanvasController {
	start(): void;
	resize(): void;
	dispose(): void;
}

export function createIdleGuideCanvasController(input: {
	canvas?: HTMLCanvasElement | null;
	win?: Window;
	doc?: Document;
	enabled?: boolean;
	random?: () => number;
} = {}): IdleGuideCanvasController {
	const win = getWindow(input.win);
	const doc = getDocument(input.doc);
	const canvas = input.canvas ?? (doc?.getElementById("idle-guide-canvas") as HTMLCanvasElement | null);
	const ctx = canvas?.getContext("2d") ?? null;
	const enabled = input.enabled ?? IDLE_GUIDE_BACKGROUND_ENABLED;
	let raf: number | null = null;
	let field: IdleGuideParticleField = { width: 1, height: 1, particles: [] };

	const resize = () => {
		if (!win || !canvas || !ctx) return;
		const dpr = Math.min(win.devicePixelRatio || 1, 1.6);
		const width = win.innerWidth;
		const height = win.innerHeight;
		canvas.width = Math.max(1, Math.floor(width * dpr));
		canvas.height = Math.max(1, Math.floor(height * dpr));
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		field = enabled ? createIdleGuideParticleField({ width, height, random: input.random }) : { width, height, particles: [] };
	};

	const draw = (nowFrame: number) => {
		if (!win || !doc || !ctx) return;
		if (!enabled) {
			doc.body.classList.remove("idle-guide-on", "idle-guide-interactive", "idle-guide-dragging");
			ctx.clearRect(0, 0, field.width, field.height);
			raf = win.requestAnimationFrame(draw);
			return;
		}
		doc.body.classList.add("idle-guide-on");
		const t = nowFrame / 1000;
		const cx = field.width * 0.5;
		const cy = field.height * 0.5;
		const breathe = 0.5 + 0.5 * Math.sin(t * 0.72);
		const rot = {
			sx: Math.sin(-0.12),
			cx: Math.cos(-0.12),
			sy: Math.sin(t * 0.012),
			cy: Math.cos(t * 0.012),
		};
		const depth = Math.max(520, Math.min(field.width, field.height) * 0.92);
		ctx.clearRect(0, 0, field.width, field.height);
		ctx.globalCompositeOperation = "lighter";
		const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(field.width, field.height) * (0.36 + breathe * 0.035));
		halo.addColorStop(0, `rgba(255,255,255,${(0.034 + breathe * 0.020).toFixed(3)})`);
		halo.addColorStop(0.44, "rgba(255,255,255,0.014)");
		halo.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = halo;
		ctx.fillRect(0, 0, field.width, field.height);
		for (const p of field.particles) {
			const localA = p.a + t * p.speed;
			const wanderA = p.phase + t * p.wobbleSpeed;
			const wobble = Math.sin(wanderA) * p.wobbleAmp + Math.sin(t * (p.wobbleSpeed * 0.57 + 0.11) + p.phase * 1.7) * p.wobbleAmp * 0.45;
			let x = 0;
			let y = 0;
			let pointScale = 1;
			if (p.ring) {
				const rr = p.r + wobble + breathe * 12;
				const baseX = Math.cos(localA) * rr + Math.sin(wanderA * 0.73) * p.wobbleAmp * 0.54 + p.driftX;
				const baseY = Math.sin(localA + Math.sin(wanderA) * 0.10) * rr * p.oval + Math.sin(t * 0.33 + p.phase) * p.wobbleAmp * 0.68 + p.driftY;
				const baseZ = Math.sin(localA * 0.84 + p.phase * 0.31) * rr * p.zAmp + p.z * 0.54 + Math.cos(wanderA * 0.91) * p.wobbleAmp;
				const projected = projectIdleGuidePoint(baseX, baseY, baseZ, rot, cx, cy, depth);
				x = projected.x;
				y = projected.y;
				pointScale = projected.scale;
			} else {
				const driftX = (p.cx - 0.5) * field.width * 0.92 + Math.cos(localA) * (12 + p.wobbleAmp * 0.28) + wobble * 0.28;
				const driftY = (p.cy - 0.5) * field.height * 0.72 + Math.sin(localA * 0.8 + p.phase * 0.2) * (12 + p.wobbleAmp * 0.24);
				const driftZ = p.z + Math.sin(localA + p.phase) * (32 + p.wobbleAmp * 0.32);
				const projected = projectIdleGuidePoint(driftX, driftY, driftZ, rot, cx, cy, depth * 1.16);
				x = projected.x;
				y = projected.y;
				pointScale = projected.scale;
			}
			const alpha = p.ring
				? (0.070 + breathe * 0.065 + Math.sin(t * (0.8 + p.layer) + p.phase) * 0.024)
				: 0.034;
			ctx.beginPath();
			ctx.arc(x, y, p.size * pointScale, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha).toFixed(3)})`;
			ctx.fill();
		}
		ctx.globalCompositeOperation = "source-over";
		raf = win.requestAnimationFrame(draw);
	};

	return {
		start() {
			if (!win || !canvas || !ctx || raf != null) return;
			resize();
			raf = win.requestAnimationFrame(draw);
			win.addEventListener("resize", resize);
		},
		resize,
		dispose() {
			if (!win) return;
			if (raf != null) win.cancelAnimationFrame(raf);
			raf = null;
			win.removeEventListener("resize", resize);
			doc?.body.classList.remove("idle-guide-on", "idle-guide-interactive", "idle-guide-dragging");
		},
	};
}
