# Updater Release License Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Tauri updater, Windows packaging, release identity, GPL-3.0 notices, dependency license audit, and final release gates.

**Architecture:** Tauri updater replaces Electron patch JSON. Release artifacts use new fork identity, new app id, new repository/channel, and package notices. License gate blocks public release until complete.

**Tech Stack:** Tauri updater, Rust/Tauri bundle, Bun/npm dependency audit, cargo license audit, Markdown notices.

---

## Required Reading

- `docs/migration/LICENSE_GATE.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/DEFERRED_CAPABILITIES.md`
- `docs/migration/PRD_TAURI_REWRITE.md`

## Preconditions

- Tauri app builds.
- Capability parity gates are complete or explicitly marked.
- Deferred capabilities have final release decisions.

## Files

- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Modify: `apps/desktop/src-tauri/src/updater.rs`
- Modify: `apps/web/src/update/`
- Create/modify: `THIRD_PARTY_NOTICES.md`
- Modify: `README.md`
- Modify: `NOTICE.md`
- Modify: `docs/migration/LICENSE_GATE.md`
- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`

## Do Not

- Do not use old Electron `latest.yml`.
- Do not migrate old patch JSON.
- Do not release under original Mineradio identity without fork clarity.
- Do not include unreviewed QQ project code.
- Do not publish while `LICENSE_GATE.md` contains unresolved required audit rows.

## Task 1: Tauri Updater

- [ ] **Step 1: Choose manifest mode**

Use static JSON first for local testing unless a dynamic server is already available.

- [ ] **Step 2: Configure updater**

Configure Tauri updater endpoint, public key/signing as required by selected updater mode.

- [ ] **Step 3: React update UI**

React shows:

- checking.
- update available.
- download/install.
- error.
- restart required.

- [ ] **Step 4: Verify local update**

Build lower version and higher version, point manifest to higher version, test detection and update path.

## Task 2: Release Identity

- [ ] **Step 1: New app id**

Confirm app id does not reuse `com.mineradio.desktop`.

- [ ] **Step 2: New app name**

If public distribution is planned, README and release notes must identify the project as a fork.

- [ ] **Step 3: Data directory**

Confirm Tauri app data directory does not read old Mineradio user directory by default.

## Task 3: License Audit

- [ ] **Step 1: Audit npm/Bun dependencies**

Fill dependency license table.

- [ ] **Step 2: Audit Rust crates**

Fill Rust crate license table or generated notice.

- [ ] **Step 3: Audit QQ projects**

For every QQ reference project, fill:

```text
Project, URL, License, Active, Usage, Copy Code?, Risk, Decision
```

- [ ] **Step 4: GSAP check**

Confirm no member-only or closed plugin is bundled.

## Task 4: Notices

- [ ] **Step 1: Create `THIRD_PARTY_NOTICES.md`**

List:

- original project and GPL-3.0.
- Tauri.
- Bun.
- React.
- Vite.
- Zustand.
- zod.
- NeteaseCloudMusicApi.
- Three.js.
- GSAP.
- QQ reference projects if used.

- [ ] **Step 2: Update README and NOTICE**

State fork status and license.

## Task 5: Final Gates

- [ ] **Step 1: Capability parity**

Every item in `CAPABILITY_PARITY_CHECKLIST.md` must be complete or explicitly blocked before public release.

- [ ] **Step 2: Deferred capabilities**

No `deferred` item can remain undecided before public release.

- [ ] **Step 3: License gate**

No required `待审核` or unknown license remains before public release.

## Verification

Run:

```powershell
cargo test
bun test
bun run --filter ./apps/web build
bun run --filter ./apps/desktop tauri build
git diff --check
```

Then manually verify:

```text
install -> launch -> update check -> update install/restart -> uninstall
```

Expected: all checks pass, updater works, notices are complete, no unresolved release gate remains.

## Subagent Prompt Summary

Implement updater/release/license only after the app is otherwise functional. Do not use old Electron patch JSON. Do not publish with unresolved license entries. Verify installer and updater on Windows.
