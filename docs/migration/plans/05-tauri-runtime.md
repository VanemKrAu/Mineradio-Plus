# Tauri Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Rust/Tauri runtime layer that owns windows, commands, app data paths, sidecar lifecycle, and updater boundary.

**Architecture:** Rust starts and monitors the Bun sidecar, exposes runtime config through commands, owns WebView windows and system operations, and leaves music/provider business logic to the sidecar.

**Tech Stack:** Tauri 2, Rust, WebView2, Tauri sidecar capabilities, Tauri updater boundary.

---

## Required Reading

- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/plans/02-workspace-tauri-shell.md`
- `docs/migration/plans/04-sidecar-provider-gateway.md`

## Preconditions

- `apps/desktop/src-tauri` exists.
- `sidecars/api` exposes `/health`.
- Tauri shell opens React app.

## Files

- Create/modify: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/commands.rs`
- Create: `apps/desktop/src-tauri/src/sidecar.rs`
- Create: `apps/desktop/src-tauri/src/windows.rs`
- Create: `apps/desktop/src-tauri/src/paths.rs`
- Create: `apps/desktop/src-tauri/src/updater.rs`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/capabilities/*.json`

## Do Not

- Do not call NeteaseCloudMusicApi from Rust.
- Do not hardcode sidecar port.
- Do not reuse old Electron app id.
- Do not implement old patch JSON updater.
- Do not store cookies in Rust state.

## Task 1: Runtime Config Command

- [ ] **Step 1: Define runtime config**

Create Rust struct:

```rust
#[derive(serde::Serialize, Clone)]
pub struct RuntimeConfig {
    pub sidecar_base_url: String,
    pub app_data_dir: String,
    pub app_version: String,
    pub schema_version: String,
}
```

- [ ] **Step 2: Expose command**

Command name:

```text
get_runtime_config
```

It returns `RuntimeConfig`.

- [ ] **Step 3: Verify**

Run:

```powershell
cargo test
```

Expected: exits 0.

## Task 2: Sidecar Lifecycle

- [ ] **Step 1: Allocate random port**

Use OS-assisted port allocation or bind probe to select local port. Store it in managed app state.

- [ ] **Step 2: Start sidecar**

Start sidecar with environment variables:

```text
MINERADIO_SIDECAR_PORT
MINERADIO_APP_DATA_DIR
MINERADIO_LOG_DIR
MINERADIO_APP_VERSION
```

- [ ] **Step 3: Health wait**

Poll `/health` until success or timeout. On timeout, expose failure state to React.

- [ ] **Step 4: Restart policy**

If sidecar exits unexpectedly, restart once with backoff and emit UI event.

## Task 3: Window Commands

- [ ] **Step 1: Implement shell commands**

Commands:

```text
window_minimize
window_toggle_maximize
window_toggle_fullscreen
window_close
open_external
export_json_file
import_json_file
```

- [ ] **Step 2: Implement window labels**

Reserve labels:

```text
main
desktop-lyrics
wallpaper
login-netease
login-qq
```

- [ ] **Step 3: Verify command availability**

React shell can invoke `get_runtime_config` and window commands without panic.

## Task 4: Tauri Capabilities

- [ ] **Step 1: Grant required permissions**

Capabilities must cover:

- shell/sidecar execution.
- window management.
- dialog or filesystem operations used by import/export.
- updater plugin when enabled.

- [ ] **Step 2: Verify no broad unnecessary permissions**

Do not grant broad filesystem access beyond planned import/export and app data needs.

## Task 5: Verification

- [ ] **Step 1: Rust tests**

```powershell
cargo test
```

Expected: exits 0.

- [ ] **Step 2: Tauri dev**

```powershell
bun run --filter ./apps/desktop tauri dev
```

Expected: app opens, sidecar health resolves, runtime config visible.

## Subagent Prompt Summary

Implement Rust/Tauri runtime only. Do not implement provider logic or React UI beyond command calls. Configure sidecar capabilities. Verify with `cargo test` and Tauri dev.
