# Tauri Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new GPL-3.0 Tauri 2 fork that reaches full Electron baseline capability and visual parity before public release.

**Architecture:** Create the new Tauri/Bun/React workspace in parallel with the Electron baseline. Rust owns desktop/system/updater/sidecar lifecycle, Bun owns provider and local API services, React/Zustand owns UI state, shared/zod owns contracts, and visual-engine owns Canvas/WebGL/GSAP parity.

**Tech Stack:** Tauri 2, Rust, WebView2, Bun workspace, Vite, TypeScript, React, Zustand, zod, Bun sidecar runtime, NeteaseCloudMusicApi, Canvas/WebGL/GSAP, Tauri updater.

---

## Platform Constraints

- Bun workspaces require the root `package.json` `workspaces` field and produce a root `bun.lock`.
- Bun workspace scripts may be run with `bun --filter <pattern> <script>` or `bun run --filter <pattern> <script>` once the target workspace declares that script.
- Tauri sidecars must be bundled as external binaries and granted command execution permission in Tauri capabilities.
- Tauri updater must be designed around either a dynamic update server or a static JSON manifest. Do not port the old Electron patch JSON system.

## Scope Check

This migration spans multiple independent subsystems. Do not execute it as one giant coding task. Use this document as the master plan and create task-specific implementation plans before coding each subsystem when details exceed a single task.

The first implementation pass must be ordered to reduce risk:

1. Freeze Electron baseline.
2. Establish workspace and app shell.
3. Establish shared contracts.
4. Establish sidecar provider gateway.
5. Establish React shell and state.
6. Migrate playback and lyrics.
7. Migrate visual engine.
8. Migrate desktop windows.
9. Add Tauri updater and release gates.
10. Complete license audit and final parity.

## Planned File Structure

- Create: `apps/desktop/` for the Tauri app and Rust commands.
- Create: `apps/web/` for Vite + React + Zustand.
- Create: `sidecars/api/` for Bun API sidecar.
- Create: `packages/shared/` for zod schemas and shared types.
- Create: `packages/visual-engine/` for Canvas/WebGL/GSAP lifecycle modules.
- Create: `docs/migration/baseline/` for baseline capture instructions and generated references.
- Create: `docs/migration/plans/` for subsystem plans created from this master plan.
- Modify: root `package.json` only when moving to Bun workspace.
- Modify: `.gitignore` when generated Tauri/Bun outputs are introduced.
- Keep: `public/`, `desktop/`, `server.js` as Electron baseline reference until visual parity is proven.

## Task 1: Freeze Electron Baseline

**Files:**
- Create: `docs/migration/baseline/BASELINE_CAPTURE.md`
- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Use sub-plan: `docs/migration/plans/01-baseline-freeze.md`

- [ ] **Step 1: Write baseline capture instructions**

Create `docs/migration/baseline/BASELINE_CAPTURE.md` using `docs/migration/plans/01-baseline-freeze.md`.

```markdown
# Baseline Capture

## Environment

- App: current Electron baseline
- Window size: 1280x720 and 1920x1080
- Test track: record exact title, provider, track id, cover source, lyric source
- Visual archive: record the baseline archive file or JSON snapshot

## Required Captures

- Home idle screenshot
- Startup animation recording
- Playback control console screenshot
- Playback console hide/show recording
- Visual console screenshot
- 3D shelf open screenshot
- 3D shelf scroll and detail recording
- Desktop lyrics white background screenshot
- Desktop lyrics black background screenshot
- Desktop lyrics lock/unlock/drag recording

## Storage

Save generated screenshots and recordings outside git unless explicitly curated.
Only commit this capture plan and small textual metadata.
```

- [ ] **Step 2: Update parity checklist**

Mark the checklist as requiring `docs/migration/baseline/BASELINE_CAPTURE.md` before any visual migration work.

- [ ] **Step 3: Verify**

Run:

```powershell
git diff --check
```

Expected: exits 0.

## Task 2: Create Bun Workspace And Tauri Skeleton

**Files:**
- Modify: `package.json` workspace structure
- Create: `bun.lock`
- Create: `apps/desktop/src-tauri/`
- Create: `apps/web/`
- Create: `sidecars/api/`
- Create: `packages/shared/`
- Create: `packages/visual-engine/`
- Modify: `.gitignore`
- Use sub-plan: `docs/migration/plans/02-workspace-tauri-shell.md`

- [ ] **Step 1: Create a subsystem plan**

Before code changes, read `docs/migration/plans/02-workspace-tauri-shell.md`. If platform tooling has changed, update that sub-plan first.

- [ ] **Step 2: Scaffold workspace**

Use Bun workspace and Tauri 2 scaffolding. The scaffold must use a new app id and must not reuse `com.mineradio.desktop`. The root `package.json` must define `workspaces` covering `apps/*`, `packages/*`, and `sidecars/*`.

- [ ] **Step 3: Add health-only sidecar**

Create a minimal Bun sidecar with `/health` returning:

```json
{
  "ok": true,
  "appVersion": "0.0.0-dev",
  "apiVersion": "0.1.0",
  "schemaVersion": "0.1.0",
  "providers": []
}
```

- [ ] **Step 4: Verify**

Run:

```powershell
bun install
bun run --filter ./sidecars/api test
cargo test
bun run --filter ./apps/web build
```

Expected: all commands exit 0.

## Task 3: Define Shared Contracts

**Files:**
- Create: `packages/shared/src/provider.ts`
- Create: `packages/shared/src/track.ts`
- Create: `packages/shared/src/envelope.ts`
- Create: `packages/shared/src/health.ts`
- Create: `packages/shared/src/persistence.ts`
- Create: `packages/shared/src/index.ts`
- Create: shared package tests
- Use sub-plan: `docs/migration/plans/03-shared-contracts.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/03-shared-contracts.md` and update it first if platform constraints changed.

- [ ] **Step 2: Define envelope**

Success/error responses must follow:

```ts
type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    provider?: string;
    retryable: boolean;
    action?: string;
  };
};
```

- [ ] **Step 3: Define provider core interface**

The shared contract must cover `search`, `songUrl`, `lyric`, `playlistList`, `playlistDetail`, `loginStatus`, and `logout`.

- [ ] **Step 4: Verify**

Run:

```powershell
bun test packages/shared
```

Expected: contract tests pass and invalid sample payloads fail validation.

## Task 4: Build Sidecar Provider Gateway

**Files:**
- Create: `sidecars/api/src/server.ts`
- Create: `sidecars/api/src/providers/provider-adapter.ts`
- Create: `sidecars/api/src/providers/netease/`
- Create: `sidecars/api/src/providers/qq/`
- Create: `sidecars/api/src/services/audio-proxy.ts`
- Create: `sidecars/api/src/services/fallback.ts`
- Create: `sidecars/api/src/services/diagnostics.ts`
- Create: sidecar tests
- Use sub-plan: `docs/migration/plans/04-sidecar-provider-gateway.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/04-sidecar-provider-gateway.md` and update it first if provider scope changed.

- [ ] **Step 2: Implement gateway**

The gateway must expose `/health`, provider search, provider song URL, lyric, playlist list, playlist detail, login status, logout, diagnostics, and audio proxy routes.

- [ ] **Step 3: Implement provider adapters**

Netease uses `NeteaseCloudMusicApi`. QQ starts with the existing project behavior as reference and only integrates external project code after license gate approval.

- [ ] **Step 4: Verify**

Run:

```powershell
bun test sidecars/api
bun run --filter ./sidecars/api dev
```

Expected: tests pass and `/health` responds with matching schema.

## Task 5: Build Tauri Runtime Layer

**Files:**
- Create: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/commands.rs`
- Create: `apps/desktop/src-tauri/src/sidecar.rs`
- Create: `apps/desktop/src-tauri/src/windows.rs`
- Create: `apps/desktop/src-tauri/src/updater.rs`
- Create: Rust tests where practical
- Use sub-plan: `docs/migration/plans/05-tauri-runtime.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/05-tauri-runtime.md` and update it first if Tauri APIs changed.

- [ ] **Step 2: Implement sidecar lifecycle**

Rust starts the sidecar with random port and app data paths, waits for `/health`, and exposes runtime config to React. Tauri sidecar permissions must be configured in capabilities before any JavaScript-side sidecar execution is used.

- [ ] **Step 3: Implement system commands**

Commands cover window controls, external URL/file open, import/export, login windows, desktop lyrics window, wallpaper window, global hotkeys, and updater status.

- [ ] **Step 4: Verify**

Run:

```powershell
cargo test
bun run --filter ./apps/desktop tauri dev
```

Expected: Tauri window opens, runtime config is available, sidecar health is visible.

## Task 6: Build React Shell And Zustand Stores

**Files:**
- Create: `apps/web/src/app/`
- Create: `apps/web/src/stores/`
- Create: `apps/web/src/api/`
- Create: `apps/web/src/tauri/`
- Create: React/Zustand tests
- Use sub-plan: `docs/migration/plans/06-react-shell-stores.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/06-react-shell-stores.md` and update it first if React shell scope changed.

- [ ] **Step 2: Implement shell**

React shell includes layout, player control surface, search panel, queue panel, provider status, update status, and visual host placeholders.

- [ ] **Step 3: Implement Zustand stores**

Stores: playback, provider, visual, shelf, ui, update.

- [ ] **Step 4: Verify**

Run:

```powershell
bun test apps/web
bun run --filter ./apps/web build
```

Expected: tests and production build pass.

## Task 7: Migrate Playback, Search, Lyrics, And Queue

**Files:**
- Modify: `apps/web/src/`
- Modify: `sidecars/api/src/`
- Modify: `packages/shared/src/`
- Use sub-plan: `docs/migration/plans/07-playback-search-lyrics.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/07-playback-search-lyrics.md` and update it first if playback scope changed.

- [ ] **Step 2: Implement search-to-play flow**

Search results become unified `Track` values, queue operations use Zustand, and playback URL resolution goes through sidecar.

- [ ] **Step 3: Implement lyrics**

Lyrics are fetched through provider adapters and synchronized to playback state.

- [ ] **Step 4: Verify**

Run WebView2 manual test:

```text
search -> add to queue -> play -> pause -> seek -> next -> ended next -> lyric sync
```

Expected: all external behavior matches Electron baseline.

## Task 8: Migrate Visual Engine

**Files:**
- Create/modify: `packages/visual-engine/src/`
- Modify: `apps/web/src/visual/`
- Modify: `docs/migration/baseline/`
- Use sub-plan: `docs/migration/plans/08-visual-engine-parity.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/08-visual-engine-parity.md` and update it first if visual parity scope changed.

- [ ] **Step 2: Extract imperative engine**

Move startup, particle stage, lyric stage, GSAP timelines, and 3D shelf into visual-engine modules with lifecycle APIs.

- [ ] **Step 3: Connect React host**

React passes snapshots and callbacks. Visual engine owns render loop and WebGL resources.

- [ ] **Step 4: Verify**

Run:

```powershell
bun run --filter ./apps/web build
```

Then run Playwright screenshot checks and manual recording comparison against baseline.

Expected: no blank canvas, no flicker, visual parity approved.

## Task 9: Migrate Desktop Lyrics, Wallpaper, And Windows Features

**Files:**
- Modify: `apps/desktop/src-tauri/src/windows.rs`
- Modify: `apps/web/src/desktop-lyrics/`
- Modify: `packages/shared/src/desktop.ts`
- Use sub-plan: `docs/migration/plans/09-desktop-windows.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/09-desktop-windows.md` and update it first if desktop-window scope changed.

- [ ] **Step 2: Implement desktop lyrics**

Desktop lyrics must support open, close, always-on-top, click-through, drag, middle-click lock/unlock, and visual parity on white/black backgrounds.

- [ ] **Step 3: Implement wallpaper/overlay capabilities**

Stable original overlay behavior must be migrated or tracked in `DEFERRED_CAPABILITIES.md` with final release decision.

- [ ] **Step 4: Verify**

Manual Windows verification:

```text
desktop lyrics open -> lock -> background click-through -> middle-click unlock -> drag -> close
```

Expected: behavior matches Electron baseline.

## Task 10: Add Tauri Updater And Release Gates

**Files:**
- Modify: `apps/desktop/src-tauri/`
- Modify: `apps/web/src/update/`
- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Modify: `docs/migration/LICENSE_GATE.md`
- Use sub-plan: `docs/migration/plans/10-updater-release-license.md`

- [ ] **Step 1: Create a subsystem plan**

Read `docs/migration/plans/10-updater-release-license.md` and update it first if release scope changed.

- [ ] **Step 2: Implement updater UI and commands**

Use Tauri updater for detection/download/install flow. Do not migrate old patch JSON.

- [ ] **Step 3: Complete license gate**

Fill dependency audit, QQ project audit, notices, GPL/fork statements, and package notices.

- [ ] **Step 4: Verify**

Run:

```powershell
cargo test
bun test
bun run --filter ./apps/web build
bun run --filter ./apps/desktop tauri build
```

Then test low-version to high-version updater flow on Windows.

Expected: installer, launch, updater, license, and parity gates pass.

## Self-Review

- PRD coverage: all PRD decisions map to tasks above.
- Scope split: each subsystem must get a detailed sub-plan before code work.
- Placeholder check: license audit tables intentionally contain `待审核` until the license gate task; no public release is allowed while those remain.
- Type consistency: shared contract task precedes sidecar, React, and Tauri API use.
- Risk order: baseline and contracts happen before visual and desktop-window migration.
