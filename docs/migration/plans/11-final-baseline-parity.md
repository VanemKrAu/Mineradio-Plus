# Final Baseline Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the Tauri rewrite from the current partial migration state to full Electron baseline capability, visual parity, interaction parity, Windows runtime parity, and public-release readiness.

**Architecture:** Treat the retained Electron code as the executable specification. React/Zustand owns UI state and stable DOM hosts, `packages/visual-engine` owns all imperative Canvas/WebGL/Three/GSAP behavior, the Bun sidecar owns providers/audio proxy/diagnostics, and Rust/Tauri owns windows, sidecar lifecycle, login WebViews, installer, updater, and OS integration.

**Tech Stack:** Tauri 2, Rust, WebView2, Bun workspace, Vite, TypeScript, React, Zustand, zod, Bun sidecar runtime, Three.js, GSAP, Canvas/WebGL, Tauri updater, Windows NSIS.

---

## Why This Plan Exists

The migration has many code-complete slices, but the current app does not yet behave like the Electron baseline after splash. The most recent audit found that the startup shell, Empty Home state machine, Search entry, bottom controls, visual engine data feeds, playback proxy path, sidecar lifecycle, and release gates are not closed as one product experience.

This plan supersedes using the old master implementation plan as a direct execution source. Existing plans `01` through `10` remain historical and subsystem references. New implementation work should start from this plan or from a smaller child plan explicitly created from one of its phases.

## Required Reading

- `AGENTS.md`
- `docs/migration/EXECUTION_PROTOCOL.md`
- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/DEFERRED_CAPABILITIES.md`
- `docs/migration/LICENSE_GATE.md`
- `docs/migration/baseline/BASELINE_CAPTURE.md`
- `docs/migration/baseline/BASELINE_ANIMATION_SPEC.md`
- `docs/GLASS_SVG_TEXTURE.md`
- `public/index.html`
- `server.js`
- `desktop/main.js`
- `desktop/preload.js`
- `desktop/overlay-preload.js`

## Current Audit Summary

> Status note, 2026-06-29: the gap list below is the audit snapshot that created this final parity plan. Many code-side slices have since been implemented and verified. Treat the current gate source of truth as `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`: code-side Phase 1-5 closure is recorded there, while visual/WebView2/provider-account/Windows installer/release evidence remains open until manually captured.

### P0 Product Gaps

- Original gap: startup shell, Empty Home state machine, search/bottom/top-right mounts, and playback handoff were incomplete when this plan was written.
- 2026-06-29 code-side status: these shell/product-flow paths have been restored through React/Zustand hosts, cross-source search, baseline queue semantics, sidecar `/song-url`, and `/audio-proxy` wiring. Remaining closure requires WebView2/Electron side-by-side verification and real playback evidence.

### P1 Visual And Interaction Gaps

- Original gap: splash sound, HomeVisual cover/depth/ripple/skull/free-camera chain, stage lyric word timing, connector particles, shelf data/actions/detail/feedback, resize/camera and nonblank proof were incomplete when this plan was written.
- 2026-06-29 code-side status: those visual-engine slices are implemented or guarded as hidden by decision where applicable. Remaining closure requires WebView2/Electron visual recordings, real provider shelf data, and interaction parity evidence.

### P1 Runtime And Release Gaps

- Original gap: sidecar supervision/logging, login WebView cookie extraction/session injection, desktop lyrics runtime parity, updater/release/license packaging, and Windows installer evidence were incomplete when this plan was written.
- 2026-06-29 code-side status: sidecar child retention/restart/logging/diagnostics, login WebView injection, desktop lyrics payload/fit/scroll/native middle-click poller, updater detection-only UI/policy, NSIS config, license audits, packaged-notices declarations, and Tauri build are implemented. Remaining closure requires B1 account validation, Windows/WebView2 runtime evidence, release manifest/upload/signature decision evidence, install/uninstall proof, and packaged notice inspection.

## Execution Rules

- Work only in `C:\Users\zhanw\.config\superpowers\worktrees\Mineradio\codex-tauri-migration` on branch `codex/tauri-migration`.
- Do not modify the main workspace `D:\项目\Mineradio` for this migration.
- Treat `public/`, `desktop/`, and `server.js` as read-only baseline references.
- Write files as UTF-8. In PowerShell, run `chcp 65001` before reading Chinese files and use `Get-Content -Encoding UTF8`.
- Use `& 'C:\Users\zhanw\.bun\bin\bun.exe'` for Bun commands.
- Implement one phase at a time. Each phase must end with spec compliance review, code quality review, verification evidence, and one commit.
- Use `subagent-driven-development`: one implementer agent per phase, followed by two review passes. Reviewers must compare against baseline code, not against memory.
- Stop after two consecutive failures of the same gate. Change evidence source or narrow the phase before retrying.
- Do not claim parity from code inspection alone. Visual and interaction parity require screenshots or recordings against Electron baseline.

## Phase 0: Reconcile Plans And Evidence

**Goal:** Make the planning layer reflect the current audit so future agents do not continue from stale milestones.

**Files:**

- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Modify: `docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`
- Modify: `docs/migration/plans/08-visual-engine-parity.md`
- Modify: `docs/migration/plans/10-updater-release-license.md`
- Modify: `docs/migration/baseline/BASELINE_CAPTURE.md`

**Baseline References:**

- Startup/Home: `public/index.html` around `body.splash-active`, `#empty-home`, `#search-area`, `#top-right`, `#bottom-handle`, `#bottom-bar`, `dismissSplash`, `updateEmptyHomeVisibility`.
- Playback/provider: `server.js` Netease/QQ routes, audio proxy, and `public/index.html` search/queue/playback functions.
- Windows/runtime: `desktop/main.js` login windows, desktop lyrics, update behavior.

- [x] **Step 1: Record the audit state**

  Add a dated note to `CAPABILITY_PARITY_CHECKLIST.md` explaining that `417cedc` is a code-side mitigation for post-splash blackness, not Home parity. Record that Home parity now has its own execution phase and gate.

- [x] **Step 2: Mark stale plan areas**

  Update `IMPLEMENTATION_PLAN_TAURI_REWRITE.md` and the affected `08`/`10` plans with short notes that the directories and many code slices already exist, and that final implementation must continue from `11-final-baseline-parity.md`.

- [x] **Step 3: Fill missing baseline capture metadata**

  Update `BASELINE_CAPTURE.md` with the current required capture list for Home, search, bottom controls, playback, 3D shelf, desktop lyrics, and updater installer checks. Do not mark captures complete unless artifact paths exist.

- [x] **Step 4: Verify documentation-only phase**

  Run:

  ```powershell
  chcp 65001
  git diff --check
  ```

  Expected: `git diff --check` exits 0.

- [x] **Step 5: Review and commit**

  2026-06-30 controller note: spec compliance and code quality reviews passed; this single Phase 0 commit records docs-only reconciliation.

  Review that no capability checkbox was incorrectly checked from code-only evidence.

  Commit message:

  ```text
  docs(migration): add final baseline parity plan
  ```

## Phase 1: Startup Shell And Empty Home Parity

**Goal:** After splash dismissal, the Tauri app must show the same baseline startup shell: Empty Home, search peek, top-right commands, bottom handle, and bottom console behavior.

> 2026-06-30 execution status: Phase 1 is code-side complete for current migration execution. Existing implementation and automated verification cover Steps 1-7; screenshots/recordings are explicitly non-blocking for phase progression under the current user directive, but remain required release/parity evidence and do not close capability checklist gates by themselves.

**Files:**

- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/home/EmptyHomeHost.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/components/search/SearchPanel.tsx`
- Modify/Create: `apps/web/src/components/shell/TopRightControls.tsx`
- Modify/Create: `apps/web/src/components/shell/BottomControlsHost.tsx`
- Modify: `apps/web/src/visual/PlayerConsoleHost.tsx`
- Modify/Create: `apps/web/src/stores/ui-store.ts`
- Modify/Create: `apps/web/src/app/App.test.tsx`
- Modify/Create: `apps/web/src/home/EmptyHomeHost.test.tsx`

**Baseline References:**

- Empty Home CSS and DOM: `public/index.html` `#empty-home`, `.empty-home-*`, `body.empty-home-active`.
- Search shell: `public/index.html` `#search-area`, `#search-box`, `#search-results`, search mode tabs, history, peek behavior.
- Top-right shell: `public/index.html` `#top-right`.
- Bottom controls: `public/index.html` `#bottom-handle`, `#bottom-bar`, `revealBottomControls`, `hideBottomControls`, `openHomePlayerConsole`.
- State machine: `public/index.html` `shouldShowEmptyHomeCore`, `updateEmptyHomeVisibility`, `setSearchAreaPeek`.

- [x] **Step 1: Add failing App shell contract tests**

  Tests must assert that after splash is dismissed the DOM contains `#empty-home`, `#search-area`, `#top-right`, `#bottom-handle`, and `#bottom-bar`. Tests must assert that `body.empty-home-active` is present only when playback/queue/immersive/shelf-detail conditions allow it.

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web/src/app/App.test.tsx
  ```

  Expected before implementation: tests fail because the shell elements or body classes are missing.

- [x] **Step 2: Restore baseline shell mounts**

  Mount baseline-equivalent hosts in `App.tsx` in this order: `SplashHost`, `VisualEngineHost`, `EmptyHomeHost`, search area, top-right controls, bottom handle, bottom player console. The z-index order must match Electron behavior: splash above all, Home above visual host, search/top-right/bottom controls interactive above Home where baseline allows.

- [x] **Step 3: Restore Empty Home DOM and CSS**

  Replace the current "我的音乐库" static surface with the baseline current structure: left construction hero containing "🚧此处施工，敬请期待🚧" and "展开播放器控制台", right six cards, and rail tiles. Copy only the required CSS constants and layout rules from `public/index.html`, preserving responsive top/bottom/width behavior.

- [x] **Step 4: Implement Empty Home state machine**

  Add a React/Zustand state selector equivalent to baseline `shouldShowEmptyHomeCore`: hide Home when splash is active, current playback exists, queue exists, immersive mode is active, shelf detail is open, or shelf side is pinned where baseline hides it. Apply `body.empty-home-active` and `body.controls-visible` from state.

- [x] **Step 5: Implement bottom control reveal parity**

  Connect the Home "展开播放器控制台" button, bottom hot zone, and bottom handle to the player console reveal/hide state. When visible, adjust Home bottom spacing through `controls-visible`.

- [x] **Step 6: Implement search peek shell parity**

  Render the search shell in baseline peek state on Empty Home. Empty queries show history/recommendations. Focus, blur, Escape, and Home-active behavior must follow baseline rules before adding provider search details.

- [x] **Step 7: Verify phase**

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter ./apps/web build
  git diff --check
  ```

  Expected: tests and build pass.

- [ ] **Step 8: Manual WebView2 evidence**

  2026-06-30 note: this evidence remains required for final release/parity sign-off, but screenshots/recordings are not a blocker for current phase progression per user instruction.

  Run the app and capture screenshots at 1280x720 and 1920x1080:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run tauri:dev
  ```

  Required screenshots: splash ready, splash dismissed Empty Home, search focused/history, bottom handle hover, bottom bar visible, bottom bar hidden. Expected: no debug shell, no black screen, and visible startup shell matches Electron baseline.

## Phase 2: Search, Queue, Playback, Lyrics, And Provider Runtime Parity

**Goal:** Restore the baseline user path: search, merge results, play through audio proxy, queue operations, lyrics, current-line sync, and provider errors.

> 2026-06-30 execution status: Phase 2 is code-side complete for current migration execution. Existing implementation plus regression tests cover Steps 1-7: production `SearchShell` routes all/song through cross-source search, `App` uses global `/song-url` and sidecar `/audio-proxy?url=...`, search-result playback dedupes/moves to queue front, and existing shared/sidecar/web tests cover lyrics and provider runtime parity. Screenshots, real WebView2 playback, and B1 account evidence remain required release/parity evidence and do not close final checklist gates by themselves.

**Files:**

- Modify: `apps/web/src/api/sidecar-client.ts`
- Modify: `apps/web/src/components/search/SearchPanel.tsx`
- Modify: `apps/web/src/components/search/play-search-result.ts`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/stores/playback-store.ts`
- Modify: `apps/web/src/stores/lyrics-store.ts`
- Modify: `packages/shared/src/lyric.ts`
- Modify: `sidecars/api/src/services/cross-source-resolver.ts`
- Modify: `sidecars/api/src/services/audio-proxy.ts`
- Modify: `sidecars/api/src/providers/netease/`
- Modify: `sidecars/api/src/providers/qq/`

**Baseline References:**

- Search modes and merge sorting: `public/index.html` search mode functions and result rendering.
- Queue semantics: `public/index.html` search-result click, dedupe, move-to-front, next insert, queue mode functions.
- Audio proxy: `public/index.html` `/api/audio?url=...` usage and `server.js` audio proxy headers/range.
- Provider handling: `server.js` Netease cloudsearch/song_url_v1/song_url fallback, QQ vkey/musicu/lyric fallback.
- Lyrics: `public/index.html` fallback lyric, provider lyric load, YRC/LRC parsing, stage lyric tick.

- [x] **Step 1: Add failing search and playback integration tests**

  Add tests for default `song` search using merged Netease + QQ results, provider-specific search modes, search-result click dedupe/move-to-front, and audio source using sidecar `/audio-proxy`.

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  ```

  Expected before implementation: tests fail on merged search, queue semantics, or proxy URL expectations.

- [x] **Step 2: Route web client through cross-source services**

  Make UI search use the sidecar global `/search` endpoint for baseline `song` mode and provider routes only for explicit `netease` or `qq` modes. Make UI song URL resolution use the global `/song-url` endpoint so fallback providers are exercised.

- [x] **Step 3: Use audio proxy for HTMLAudioElement**

  Convert resolved provider URLs to sidecar `/audio-proxy?url=...` before `controller.load`. Preserve Range/seek behavior and avoid exposing raw provider URL as the final audio element source.

- [x] **Step 4: Restore queue semantics**

  Implement baseline click behavior: existing track moves to queue front, new track inserts at front for immediate playback, next insert preserves current track semantics, clear/delete behavior matches baseline, and ended follows the selected mode.

- [x] **Step 5: Restore lyrics contract**

  Extend shared lyric structures only as needed to preserve baseline word timing, duration, translation, and provider metadata. Feed visual-engine stage lyrics with timing-rich data instead of only `{ t, text }`.

- [x] **Step 6: Harden provider parity**

  Netease must try baseline-quality levels and classify login/VIP/trial/copyright states. QQ must preserve song URL quality fallback, authorization/login-required classification, lyric retrieval, playlist detail, and login status behavior. Provider errors must use shared envelope error codes and recovery actions.

- [x] **Step 7: Verify automated phase**

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/shared
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter @mineradio/shared typecheck
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test sidecars/api
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter @mineradio/sidecar-api typecheck
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter ./apps/web build
  git diff --check
  ```

  Expected: all commands exit 0.

- [ ] **Step 8: Manual WebView2 evidence**

  2026-06-30 note: this evidence remains required for final release/parity sign-off, but screenshots/recordings and real account evidence are not blockers for current phase progression per user instruction.

  Verify:

  ```text
  search -> merged results -> click result -> queue front -> proxied audio src -> play -> pause -> seek -> next -> ended next -> lyric sync
  ```

  Expected: behavior matches Electron baseline. B1 credentials are required before checking account/VIP/high-quality provider gates.

## Phase 3: Visual Engine Full Parity

**Goal:** Make startup, HomeVisual, glass controls, stage lyrics, connector particles, and 3D shelf match Electron visual timing, composition, and interaction.

> 2026-06-30 execution status: Phase 3 is code-side complete for current migration execution. Existing implementation and automated verification cover Steps 1-8; this closeout also preserves HomeVisual current/previous cover parity for `data:image/*` and `blob:` sources while keeping unsupported schemes rejected. WebView2/Electron visual recordings and screenshots are explicitly non-blocking for phase progression under the current user directive, but remain required release/parity evidence and do not close capability checklist gates by themselves.

**Files:**

- Modify: `packages/visual-engine/src/splash/`
- Modify: `packages/visual-engine/src/home-visual/`
- Modify: `packages/visual-engine/src/stage-lyrics/`
- Modify: `packages/visual-engine/src/particles/connector-particles.ts`
- Modify: `packages/visual-engine/src/shelf/`
- Modify: `packages/visual-engine/src/runtime/`
- Modify: `apps/web/src/visual/VisualEngineHost.tsx`
- Modify: `apps/web/src/visual/useVisualEngine.ts`
- Modify: `apps/web/src/visual/shelf-pointer-interactions.ts`
- Modify: `apps/web/src/stores/visual-store.ts`
- Modify: `apps/web/src/stores/shelf-store.ts`

**Baseline References:**

- Splash and intro sound: `public/index.html` `playMineradioIntroSound`, startup canvas/WebGL/canvas fallback, `dismissSplash`.
- HomeVisual: `public/index.html` cover texture, depth/edge/ripple, back cover, float layer, skull preset, gesture/free camera, audio uniforms.
- Stage lyrics: `public/index.html` stage lyric builder, YRC timetable, `lyr-in`, bob, out transitions.
- Connector particles and 3D shelf: `public/index.html` `makeShelfManager`, connector particle attributes, shelf layout, camera focus, pointer/wheel/right-click/detail list.
- Glass controls: `docs/GLASS_SVG_TEXTURE.md` and baseline SVG filter values.

- [x] **Step 1: Add visual smoke and data-feed tests**

  Tests must cover resize updates, stage lyric word data, shelf data source selection, splash-ready click gate, and visual-host nonblank canvas checks where test environment allows.

- [x] **Step 2: Restore splash sound parity**

  Port baseline intro sound behavior, unlock fallback, ready gating, reduced-motion behavior, and cleanup order without breaking the existing splash visual parity.

- [x] **Step 3: Complete HomeVisual asset chain**

  Replace placeholder texture paths with real cover/current/previous cover inputs. Implement depth/edge/ripple/back-cover/float/skull/gesture/free-camera behaviors from baseline and keep audio uniform projection byte-level constants where already migrated.

- [x] **Step 4: Fix stage lyrics timing and word feed**

  Normalize render-loop time units so trigonometric and GSAP timing match baseline. Pass word timing/duration/charCount data from shared lyrics to `visual-engine`.

- [x] **Step 5: Complete connector particles**

  Restore baseline particle attributes, position, colors, randomness, and host mount conditions.

- [x] **Step 6: Complete 3D shelf data and interaction parity**

  Shelf data source order must match baseline: user playlists/favorites/podcasts where available, then queue fallback. Complete row actions, pinned detail list behavior, selection sound/feedback, hover lift, scroll zones, right-click mode mutation, and detail panel layering.

- [x] **Step 7: Add resize and camera parity**

  Add renderer/camera resize listeners in `useVisualEngine` and ensure DPR, aspect ratio, and camera projection update exactly when baseline would update them.

- [x] **Step 8: Verify automated phase**

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/visual-engine
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter @mineradio/visual-engine typecheck
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter ./apps/web build
  git diff --check
  ```

  Expected: all commands exit 0.

  2026-06-30 note: `bun test packages/visual-engine`, `bun run --filter @mineradio/visual-engine typecheck`, `bun test apps/web`, `bun run --filter ./apps/web build`, and `git diff --check` passed for the Phase 3 code-side closeout. The Vite build retained the pre-existing large chunk warning.

- [ ] **Step 9: Manual visual evidence**

  Capture WebView2 and Electron baseline side by side for: splash ready/dismiss, HomeVisual idle, playback visual entry, control console reveal/hide, visual console, stage lyrics, shelf open/scroll/detail/click, window resize. Expected: no blank canvas, no hidden visual-host failure masked by Home, no obvious timing or layering difference.

  2026-06-30 note: this evidence remains required for final release/parity sign-off, but screenshots and recordings are not a blocker for current phase progression per user instruction.

## Phase 4: Tauri Runtime, Sidecar Lifecycle, Login, Desktop Lyrics, And Windows Parity

**Goal:** Close desktop runtime behavior to match Electron where the new Tauri architecture must own system integration.

> 2026-06-30 execution status: Phase 4 is code-side complete for current migration execution. Existing implementation plus this closeout cover Steps 1-7: sidecar child retention/restart/shutdown tests, bounded log paths and diagnostics log pointers without cookie/token values, login WebView cookie extraction/session injection plus popup provider-domain filtering, desktop lyrics payload throttling/fit/scroll/native middle-click polling, hidden wallpaper UI decisions, and automated checks. Step 8 remains open: Windows/WebView2 sidecar recovery, real login/logout/session injection, desktop lyrics click-through/drag/readability, and hidden wallpaper runtime evidence remain required final release/parity evidence and non-blocking for phase progression under the current user directive.

**Files:**

- Modify: `apps/desktop/src-tauri/src/lib.rs`
- Modify: `apps/desktop/src-tauri/src/sidecar.rs`
- Modify: `apps/desktop/src-tauri/src/commands.rs`
- Modify: `apps/desktop/src-tauri/src/updater.rs`
- Modify: `apps/desktop/src-tauri/src/windows.rs`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/web/src/tauri/`
- Modify: `apps/web/src/desktop-lyrics/`
- Modify: `sidecars/api/src/server.ts`
- Modify: `sidecars/api/src/services/diagnostics.ts`

**Baseline References:**

- Electron login windows and cookie handling: `desktop/main.js` login partitions, popup handling, cookies readback.
- Desktop lyrics: `desktop/main.js`, `desktop/overlay-preload.js`, `public/index.html` desktop lyrics behavior and `BASELINE_ANIMATION_SPEC.md`.
- Sidecar/runtime expectations: `server.js` local API behavior and migration checklist Sidecar Gate.

- [x] **Step 1: Add sidecar lifecycle tests**

  Rust helper tests must prove child handle retention, health wait, restart decisions, log path construction, and shutdown cleanup. Sidecar tests must prove diagnostics do not include cookies and rolling logs receive structured events.

- [x] **Step 2: Retain and supervise sidecar child**

  Store the sidecar child handle in Tauri state, restart after crash, expose recovering/recovered status to React, and cleanly terminate on app exit.

- [x] **Step 3: Implement rolling logs**

  Write bounded sidecar/runtime logs under app data. Diagnostics export must include version, provider status, recent errors, and log pointers without cookie values.

- [x] **Step 4: Complete login WebViews**

  Implement Netease and QQ login windows with cookie extraction, login detection, popup handling, provider domain filtering, sidecar session injection, logout clearing, and no cookie echo in UI stores or diagnostics.

- [x] **Step 5: Complete desktop lyrics parity**

  Verify payload push throttling at 24/30/60/120 fps, `lyr-in` 820ms, max 24 font-fit passes, horizontal smootherstep scroll, white/black readability, click-through, middle-click unlock, drag, and always-on-top behavior.

  Code-side payload, fit, scroll, motion, and native middle-click polling are covered by existing tests. White/black readability, real click-through, drag, and always-on-top behavior still require Step 8 Windows/WebView2 evidence before final parity gates can be checked.

- [x] **Step 6: Validate hidden wallpaper decisions**

  Keep Wallpaper Engine deep integration, experimental wallpaper mode, and hand-canvas hidden unless a later plan implements and validates them. Ensure no visible UI entry advertises hidden capabilities.

- [x] **Step 7: Verify automated phase**

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test sidecars/api
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  cd apps\desktop\src-tauri
  cargo test
  cd ..\..\..
  git diff --check
  ```

  Expected: all commands exit 0.

- [ ] **Step 8: Manual Windows evidence**

  Verify Tauri dev and built app: sidecar crash/restart, login cookie injection with B1 credentials, import/export JSON, desktop lyrics open/lock/unlock/drag, white/black backgrounds, and hidden wallpaper entries.

## Phase 5: Updater, Installer, License, Notices, And Release Identity

**Goal:** Make the public release path complete without reusing old Electron updater/patch JSON or old app identity.

> 2026-06-29 execution status: B2 currently means no signing key/public key, so the shipped updater path is detection-only with an explicit `signature-key-missing` gate. Policy guards, release identity, NSIS config, release CSP, packaged-notices declaration, license/transitive audits, release-notes wording guard, and a local Tauri NSIS build are code-side complete. Keep this phase open until a real release manifest/upload path, install/uninstall evidence, packaged notices inspection, and any future signed-updater decision are captured.

**Files:**

- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/src/updater.rs`
- Modify: `apps/web/src/tauri/updater.ts`
- Modify/Create: `apps/web/src/update/`
- Modify: `README.md`
- Modify: `NOTICE.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `docs/migration/LICENSE_GATE.md`
- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Modify: `docs/migration/DEFERRED_CAPABILITIES.md`

**Baseline And Decision References:**

- `docs/migration/DECISIONS.md` A1-A8 and B1-B4.
- Electron release identity only as contrast: `package.json`, `RELEASE.md`, `CHANGELOG.md`, `docs/INSTALLER_STYLE.md`.
- Tauri updater must use new repo/channel and must not migrate old patch JSON.

- [ ] **Step 1: Resolve updater signature path**

  Choose the final public-release updater behavior under the existing B2 decision. If Tauri updater download/install is used, configure pubkey/signature generation and signed release assets. If only detection is shipped, make install UI explicit and update `CAPABILITY_PARITY_CHECKLIST.md` with the approved release risk decision.

- [ ] **Step 2: Complete updater UI**

  Under the current B2 no-signing decision, add only detection-safe user-facing states for checking, available, no update, error, and signature blocked; the UI must call Rust commands only and must not expose download/install/restart-required states unless a later signed-updater decision adds a public key and signed release assets.

- [ ] **Step 3: Configure Windows installer behavior**

  Set NSIS installer strategy, shortcuts, per-user behavior, app id, product name, icon, and install/uninstall evidence. Confirm the app data directory is new and does not read old Electron data by default.

- [ ] **Step 4: Complete license audit**

  Remove every required `待审核` state from `LICENSE_GATE.md` by auditing Rust crates, npm packages, transitive dependencies, GSAP usage, Three.js usage, and packaged notice inclusion.

- [ ] **Step 5: Complete notices and release notes**

  Ensure packaged artifacts include GPL, original project notice, fork notice, `NOTICE.md`, and `THIRD_PARTY_NOTICES.md`. Release notes must state the project is a GPL-3.0 fork/rewrite and not an official Netease, QQ, or original Mineradio release.

- [ ] **Step 6: Verify automated phase**

  Run:

  ```powershell
  chcp 65001
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/shared
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/visual-engine
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test sidecars/api
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter ./apps/web build
  cd apps\desktop\src-tauri
  cargo test
  cd ..\..\..
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run tauri:build
  git diff --check
  ```

  Expected: all commands exit 0.

- [ ] **Step 7: Manual release evidence**

  Verify:

  ```text
  install -> launch -> play -> desktop lyrics -> update check -> update install or approved manual-update path -> uninstall
  ```

  Expected: Windows installer starts, app launches, playback works, updater behavior follows the final decision, uninstall succeeds, and notices are present in the packaged artifact.

## Phase 6: Final Parity Sign-Off

**Goal:** Close every public-release gate with evidence rather than assumptions.

**Files:**

- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Modify: `docs/migration/DEFERRED_CAPABILITIES.md`
- Modify: `docs/migration/LICENSE_GATE.md`
- Modify: `docs/migration/baseline/BASELINE_CAPTURE.md`
- Create/modify: `docs/migration/release-evidence/`

- [ ] **Step 1: Complete baseline artifacts**

  Record paths for startup animation, real playback control console, 3D shelf, desktop lyrics, fixed test song, cover source, lyric source, and visual archive. Store large binaries outside git unless curated.

- [ ] **Step 2: Check every capability gate**

  For each unchecked row in `CAPABILITY_PARITY_CHECKLIST.md`, either attach evidence and check it, or record a named blocker with owner and required user input. Public release is not allowed while a required gate remains unchecked.

- [ ] **Step 3: Resolve deferred capabilities**

  Ensure every `deferred` item in `DEFERRED_CAPABILITIES.md` becomes `done`, `hidden`, or `removed-by-decision`.

- [ ] **Step 4: Close license gate**

  Ensure `LICENSE_GATE.md` has no required unresolved audit row and no unknown license for distributed dependencies.

- [ ] **Step 5: Final verification matrix**

  Run:

  ```powershell
  chcp 65001
  git diff --check
  node --check server.js
  & 'C:\Users\zhanw\.bun\bin\bun.exe' install
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/shared
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test packages/visual-engine
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test sidecars/api
  & 'C:\Users\zhanw\.bun\bin\bun.exe' test apps/web
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run --filter ./apps/web build
  cd apps\desktop\src-tauri
  cargo test
  cd ..\..\..
  & 'C:\Users\zhanw\.bun\bin\bun.exe' run tauri:build
  ```

  Expected: all commands exit 0.

- [ ] **Step 6: Final manual matrix**

  Verify on Windows/WebView2:

  ```text
  splash -> Home -> search -> play -> lyrics -> queue controls -> visual console -> 3D shelf -> desktop lyrics -> login -> provider account state -> import/export -> updater -> install/uninstall
  ```

  Expected: all public surfaces match Electron baseline or an approved decision document.

## Stop Conditions

Stop and report if any of these occur:

- Baseline code contradicts this plan.
- WebView2 behavior differs from Electron and the difference cannot be explained by an approved decision.
- A visual parity screenshot or recording shows a material mismatch.
- QQ or Netease credential validation requires B1 input.
- Updater signing/release upload requires B2/B3 input.
- License audit finds an incompatible dependency.
- The same automated or manual gate fails twice with the same failure mode.

## Subagent Prompt Template

Use this template for each phase:

```text
You are implementing Phase <N> from docs/migration/plans/11-final-baseline-parity.md in C:\Users\zhanw\.config\superpowers\worktrees\Mineradio\codex-tauri-migration on branch codex/tauri-migration.

Read AGENTS.md, docs/migration/EXECUTION_PROTOCOL.md, docs/migration/CAPABILITY_PARITY_CHECKLIST.md, and this phase before changing files.

Scope: implement only Phase <N>. Treat public/index.html, server.js, desktop/main.js, desktop/preload.js, and desktop/overlay-preload.js as read-only baseline references. Do not modify unrelated files. Do not claim parity without the requested evidence.

Run the phase verification commands with & 'C:\Users\zhanw\.bun\bin\bun.exe' for Bun. If the same gate fails twice, stop and report the failure with exact command output and file references.

Final response must include changed files, verification commands, remaining manual gates, and whether CAPABILITY_PARITY_CHECKLIST.md, DEFERRED_CAPABILITIES.md, or LICENSE_GATE.md was updated.
```

## Review Checklist

- [ ] Spec compliance review compares behavior to Electron baseline code and captured artifacts.
- [ ] Code quality review checks boundaries: React state vs visual-engine imperative loop, Rust ownership of OS features, Bun sidecar ownership of providers/audio proxy, shared zod contracts at API boundaries.
- [ ] Tests were added before implementation where behavior was not already covered.
- [ ] No release gate was checked without manual evidence when manual evidence is required.
- [ ] No hidden/deferred capability has a visible UI entry.
- [ ] Worktree is clean after commit except ignored build artifacts.
