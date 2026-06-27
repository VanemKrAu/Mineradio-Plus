# Visual Engine Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Canvas/WebGL/GSAP visual behavior into `packages/visual-engine` while matching Electron baseline exactly.

**Architecture:** React owns containers and state snapshots. `visual-engine` owns renderers, animation frames, GSAP timelines, WebGL resources, and 3D shelf internals.

**Tech Stack:** Canvas, WebGL, GSAP, TypeScript, React host components, Playwright screenshots, manual recordings.

---

## Required Reading

- `docs/GLASS_SVG_TEXTURE.md`
- `docs/migration/baseline/BASELINE_CAPTURE.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `public/index.html` baseline sections relevant to the visual module being migrated.

## Preconditions

- Baseline captures exist.
- Playback state exists.
- React visual host exists.

## Files

- Modify: `packages/visual-engine/src/`
- Modify: `apps/web/src/visual/`
- Modify: `apps/web/src/stores/visual-store.ts`
- Create: visual parity tests or screenshot scripts.
- Update: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`

## Do Not

- Do not rewrite visual look creatively.
- Do not reduce visual fidelity for performance without explicit approval.
- Do not put per-frame animation into React state.
- Do not replace glass texture with generic blur.
- Do not iframe old `public/index.html` as final solution.

## Task 1: Visual Module Inventory

- [ ] **Step 1: Identify baseline functions**

Use `rg` to locate baseline sections:

```powershell
rg -n "splash|WebGL|gsap|THREE|stageLyrics|shelf|glass|particle|visual" public/index.html
```

- [ ] **Step 2: Write migration order**

Order:

1. Startup canvas.
2. Main particle stage.
3. Player glass/control visual.
4. Lyric stage.
5. Visual control state.
6. 3D playlist shelf.

## Task 2: Engine Lifecycle

- [ ] **Step 1: Define engine interface**

Keep:

```ts
createVisualEngine(container, options)
engine.update(snapshot)
engine.resize(size)
engine.dispose()
```

- [ ] **Step 2: Add resource cleanup**

Every renderer/timeline/listener must be released in `dispose`.

## Task 3: Module Migration

For each visual module:

- [ ] **Step 1: Copy baseline constants with comments**

Only copy the minimal constants and functions needed for that module.

- [ ] **Step 2: Wrap imperative logic**

Expose typed update methods. Do not expose DOM internals to React.

- [ ] **Step 3: Compare screenshots**

Use identical size, visual archive and test track.

- [ ] **Step 4: Compare recordings**

Manually compare timing and hand feel.

## Task 4: Verification

Run:

```powershell
bun test packages/visual-engine
bun test apps/web
bun run --filter ./apps/web build
git diff --check
```

Then run Playwright screenshot/canvas checks and manual recordings.

Expected: no blank canvas, no flicker, no visual parity regression.

## Subagent Prompt Summary

Migrate one visual module at a time. Preserve exact baseline look and timing. Do not do creative redesign. Do not use React for per-frame animation. Verify screenshots, recordings and build.
