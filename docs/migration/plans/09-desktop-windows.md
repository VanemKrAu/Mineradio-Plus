# Desktop Windows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate desktop lyrics, login windows, wallpaper/overlay windows, file dialogs, and global hotkeys using Tauri/Rust.

**Architecture:** Rust owns all desktop/window behavior. React sends state snapshots and receives events. Desktop lyrics and wallpaper are separate webview windows with labels.

**Tech Stack:** Tauri 2 windows, Rust commands, WebView2, Windows-specific APIs where required, React overlay views.

---

## Required Reading

- `desktop/main.js`
- `desktop/preload.js`
- `desktop/overlay-preload.js`
- `public/desktop-lyrics.html`
- `public/wallpaper.html`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`

## Preconditions

- Tauri runtime commands exist.
- React shell can call Rust commands.
- Visual and playback state snapshots exist.

## Files

- Modify: `apps/desktop/src-tauri/src/windows.rs`
- Modify: `apps/desktop/src-tauri/src/commands.rs`
- Modify: `apps/desktop/src-tauri/src/main.rs`
- Create/modify: `apps/web/src/desktop-lyrics/`
- Create/modify: `apps/web/src/wallpaper/`
- Create/modify: `packages/shared/src/desktop.ts`

## Do Not

- Do not make desktop lyrics block background clicks when locked.
- Do not drop middle-click lock/unlock.
- Do not implement Wallpaper Engine deep integration unless separately planned.
- Do not store provider cookies in React.

## Task 1: Desktop Lyrics Window

- [ ] **Step 1: Define shared payload**

Payload includes:

```text
enabled, text, progress, colors, opacity, position, clickThrough, font, motion
```

- [ ] **Step 2: Create Tauri window**

Label: `desktop-lyrics`.

Required behavior:

- always on top.
- transparent.
- decorationless.
- click-through when locked.
- draggable when unlocked.

- [ ] **Step 3: Implement middle-click lock**

Use Tauri/Rust or Windows API if Tauri event model cannot detect middle click while click-through.

- [ ] **Step 4: Verify**

Manual:

```text
open -> lock -> click through background -> middle click unlock -> drag -> close
```

## Task 2: Login Windows

- [ ] **Step 1: Netease login window**

Open provider login webview, collect cookies, hand them to sidecar.

- [ ] **Step 2: QQ login window**

Open QQ music login webview, collect playback-related cookies, hand them to sidecar.

- [ ] **Step 3: Manual cookie import**

Frontend can send manually pasted cookie to sidecar through safe command/API.

## Task 3: Wallpaper And Overlay

- [ ] **Step 1: Recreate stable wallpaper window**

Label: `wallpaper`.

- [ ] **Step 2: WorkerW/desktop attach**

If WorkerW attach is not stable in Tauri, update `DEFERRED_CAPABILITIES.md` with status and release decision.

## Task 4: File Dialogs And Hotkeys

- [ ] **Step 1: Import/export JSON**

Rust owns file dialogs. React only receives parsed JSON or save result.

- [ ] **Step 2: Global hotkeys**

Register, detect conflicts, send events to React.

## Verification

Run:

```powershell
cargo test
bun test apps/web
bun run --filter ./apps/web build
bun run --filter ./apps/desktop tauri dev
git diff --check
```

Expected: automated checks pass and manual Windows desktop window flows match baseline.

## Subagent Prompt Summary

Implement Tauri desktop windows and system features only. Preserve click-through and middle-click behavior. Do not migrate provider business logic. Verify on Windows manually.
