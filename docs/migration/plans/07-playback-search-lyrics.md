# Playback Search Lyrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first real music flow: search, queue, resolve playable URL, play/pause/seek/next, and synchronized lyrics.

**Architecture:** React owns queue and audio element state. Sidecar owns provider search, playable URL resolution, lyrics, and fallback. Shared schemas validate all cross-boundary data.

**Tech Stack:** React, Zustand, HTMLAudioElement, Bun sidecar, shared zod contracts, WebView2 manual verification.

---

## Required Reading

- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/plans/04-sidecar-provider-gateway.md`
- `docs/migration/plans/06-react-shell-stores.md`

## Preconditions

- Sidecar gateway routes exist.
- React shell and stores exist.
- Shared `Track` and lyric schemas exist.

## Files

- Modify: `packages/shared/src/track.ts`
- Modify: `packages/shared/src/lyric.ts`
- Modify: `sidecars/api/src/providers/`
- Modify: `sidecars/api/src/services/fallback.ts`
- Modify: `apps/web/src/api/sidecar-client.ts`
- Create/modify: `apps/web/src/audio/player-controller.ts`
- Modify: `apps/web/src/stores/playback-store.ts`
- Create/modify: `apps/web/src/components/search/`
- Create/modify: `apps/web/src/components/lyrics/`

## Do Not

- Do not implement full visual engine.
- Do not put fallback/source-switching logic in React.
- Do not bypass sidecar for provider requests.
- Do not persist raw cookies in frontend.

## Task 1: Sidecar Search And URL Contract

- [ ] **Step 1: Add tests for search envelope**

Sidecar tests must assert search returns unified `Track[]` in success envelope.

- [ ] **Step 2: Implement Netease minimal search**

Use `NeteaseCloudMusicApi` for search and normalize into `Track`.

- [ ] **Step 3: Implement song URL route**

Given `Track`, return playable URL or unified error.

- [ ] **Step 4: Keep QQ compatible placeholder**

QQ returns structured `NOT_IMPLEMENTED` until QQ provider task.

## Task 2: React Search And Queue

- [ ] **Step 1: Add sidecar client methods**

Methods:

```text
search(provider, keyword, limit)
songUrl(track)
lyric(track)
```

- [ ] **Step 2: Implement search UI**

Search results show title, artists, provider, playable state.

- [ ] **Step 3: Implement queue actions**

Actions:

```text
setQueue
enqueue
playAt
next
previous
clearQueue
```

## Task 3: Audio Controller

- [ ] **Step 1: Implement controller**

Controller wraps HTMLAudioElement and emits:

```text
play
pause
timeupdate
durationchange
ended
error
```

- [ ] **Step 2: Connect store**

Playback store reflects audio events.

- [ ] **Step 3: Verify in WebView2**

Manual flow:

```text
search -> enqueue -> play -> pause -> seek -> next -> ended next
```

## Task 4: Lyrics

- [ ] **Step 1: Implement sidecar lyric route**

Normalize lyric lines into shared lyric schema.

- [ ] **Step 2: Implement lyric component**

Component displays current line and highlight progress.

- [ ] **Step 3: Verify**

Manual flow:

```text
play track -> lyric loads -> current line follows timeupdate
```

## Verification

Run:

```powershell
bun test packages/shared
bun test sidecars/api
bun test apps/web
bun run --filter ./apps/web build
node --check server.js
git diff --check
```

Expected: all exit 0, then manual WebView2 playback passes.

## Subagent Prompt Summary

Implement search/play/lyrics flow only. Do not migrate visuals or desktop lyrics. Fallback stays in sidecar. Verify automated tests and manual WebView2 playback.
