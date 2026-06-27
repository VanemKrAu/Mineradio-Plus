# Baseline Freeze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the Electron baseline so Tauri visual and behavior parity has a stable comparison target.

**Architecture:** This task does not migrate code. It records the exact baseline capture protocol, metadata format, storage rules, and checklist links needed before any Tauri implementation begins.

**Tech Stack:** Current Electron baseline, PowerShell, Markdown, optional Playwright/browser recording tools in later capture runs.

---

## Required Reading

- `AGENTS.md`
- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/EXECUTION_PROTOCOL.md`

## Files

- Create: `docs/migration/baseline/BASELINE_CAPTURE.md`
- Create: `docs/migration/baseline/BASELINE_METADATA.template.json`
- Modify: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- Modify: `.gitignore` only if a generated baseline artifact directory is introduced inside the repo.

## Do Not

- Do not capture large screenshots or videos into git by default.
- Do not create Tauri/Bun/React code directories.
- Do not modify Electron behavior.
- Do not change app version or release files.
- Do not promise old user data migration.

## Task 1: Create Baseline Capture Protocol

- [ ] **Step 1: Create `docs/migration/baseline/BASELINE_CAPTURE.md`**

Use this content:

```markdown
# Baseline Capture

## Purpose

This document defines the Electron baseline capture required before Tauri rewrite implementation. Tauri visual and behavior parity is judged against these captures.

## Environment

- Repository commit: fill after capture
- Branch: fill after capture
- App line: Electron baseline
- Window sizes:
  - 1280x720
  - 1920x1080
- Display scale: record Windows display scale
- Audio device: record output device if relevant
- Network state: record online/offline and provider login state

## Baseline Data

- Test track title:
- Test provider:
- Test track id:
- Cover source:
- Lyric source:
- Visual archive source:
- Local storage state source:

## Required Screenshots

- Home idle, 1280x720
- Home idle, 1920x1080
- Playback console visible
- Playback console hidden
- Visual console open
- Search results with populated list
- Queue panel open
- 3D shelf open
- 3D shelf detail page
- Desktop lyrics on white background
- Desktop lyrics on black background

## Required Recordings

- Startup animation
- Playback console show/hide
- Track play -> pause -> resume -> next
- Lyric sync during playback
- 3D shelf hover -> scroll -> detail -> play
- Desktop lyrics lock -> unlock -> drag

## Storage Rules

- Store large screenshots and recordings outside git unless explicitly curated.
- Suggested external folder: `D:\项目\工作区备份\Mineradio-tauri-baseline-YYYYMMDD`.
- Commit only this document and small metadata JSON.

## Acceptance

Tauri visual parity work cannot begin until this capture protocol is filled with commit, branch, test track, visual archive, and storage location.
```

- [ ] **Step 2: Create `docs/migration/baseline/BASELINE_METADATA.template.json`**

Use this content:

```json
{
  "capturedAt": "",
  "repositoryCommit": "",
  "branch": "",
  "electronVersion": "",
  "appVersion": "",
  "windowSizes": ["1280x720", "1920x1080"],
  "displayScale": "",
  "baselineStoragePath": "",
  "testTrack": {
    "provider": "",
    "id": "",
    "title": "",
    "artists": [],
    "album": "",
    "coverSource": "",
    "lyricSource": ""
  },
  "visualArchive": {
    "name": "",
    "source": "",
    "notes": ""
  },
  "captures": {
    "screenshots": [],
    "recordings": []
  }
}
```

- [ ] **Step 3: Update parity checklist**

In `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`, under `Baseline Freeze`, add:

```markdown
- [ ] `docs/migration/baseline/BASELINE_CAPTURE.md` 已填写 commit、branch、测试歌曲、视觉存档和外部存储路径。
- [ ] `docs/migration/baseline/BASELINE_METADATA.template.json` 已复制为实际 metadata 并填充。
```

- [ ] **Step 4: Verify**

Run:

```powershell
git diff --check
```

Expected: exits 0.

## Task 2: Confirm No Runtime Changes

- [ ] **Step 1: Review diff**

Run:

```powershell
git diff --name-status
```

Expected: only docs and optional `.gitignore` changed.

- [ ] **Step 2: Syntax check existing server**

Run:

```powershell
node --check server.js
```

Expected: exits 0.

## Subagent Prompt Summary

Implement only the baseline freeze documentation task. Do not create code directories. Do not run captures unless explicitly asked. After editing, run `git diff --check` and `node --check server.js`, then report changed files and whether only documentation changed.
