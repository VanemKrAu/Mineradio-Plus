# Sidecar Provider Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Bun sidecar gateway with health, provider adapter boundaries, unified envelopes, diagnostics, and a local audio proxy placeholder.

**Architecture:** The Bun sidecar exposes local HTTP APIs. Provider-specific logic lives behind adapters. The service layer owns fallback and error normalization. React never handles provider protocol differences.

**Tech Stack:** Bun HTTP server, TypeScript, zod shared package, NeteaseCloudMusicApi dependency placeholder, QQ provider placeholder.

---

## Required Reading

- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/plans/03-shared-contracts.md`
- `docs/migration/LICENSE_GATE.md`

## Preconditions

- `packages/shared` exports envelope, track, provider, health and capability schemas.
- `sidecars/api` exists.
- License gate has not approved QQ third-party code; QQ implementation must use placeholder or existing project behavior only.

## Files

- Create/modify: `sidecars/api/src/server.ts`
- Create: `sidecars/api/src/env.ts`
- Create: `sidecars/api/src/http/envelope.ts`
- Create: `sidecars/api/src/providers/provider-adapter.ts`
- Create: `sidecars/api/src/providers/netease/netease-adapter.ts`
- Create: `sidecars/api/src/providers/qq/qq-adapter.ts`
- Create: `sidecars/api/src/providers/registry.ts`
- Create: `sidecars/api/src/services/audio-proxy.ts`
- Create: `sidecars/api/src/services/diagnostics.ts`
- Create: `sidecars/api/src/services/fallback.ts`
- Create: `sidecars/api/src/**/*.test.ts`

## Do Not

- Do not copy old `server.js` wholesale.
- Do not directly integrate QQ open-source project code before license review.
- Do not expose full cookies to React.
- Do not hardcode port 3000.
- Do not implement updater in sidecar.

## Task 1: Provider Adapter Interface

- [ ] **Step 1: Create `provider-adapter.ts`**

Define:

```ts
import type { Track } from "@mineradio/shared";

export type ProviderLoginStatus = {
  provider: "netease" | "qq";
  loggedIn: boolean;
  nickname?: string;
  avatarUrl?: string;
  userId?: string;
};

export type ProviderAdapter = {
  id: "netease" | "qq";
  search(query: { keyword: string; limit: number }): Promise<Track[]>;
  songUrl(track: Track): Promise<{ url: string; proxied: boolean }>;
  lyric(track: Track): Promise<{ text: string; lines: unknown[] }>;
  playlistList(): Promise<unknown[]>;
  playlistDetail(id: string): Promise<unknown>;
  loginStatus(): Promise<ProviderLoginStatus>;
  logout(): Promise<void>;
};
```

- [ ] **Step 2: Create registry**

Registry exports all adapters and capability matrix.

- [ ] **Step 3: Add tests**

Test that registry contains `netease` and `qq`, and each exposes required methods.

## Task 2: Health And Envelope

- [ ] **Step 1: Implement `/health`**

`/health` returns shared `HealthResponseSchema` with provider ids and schema version.

- [ ] **Step 2: Implement envelope helpers**

All API handlers return:

```ts
{ ok: true, data }
```

or:

```ts
{ ok: false, error: { code, message, provider, retryable, action } }
```

- [ ] **Step 3: Add tests**

Use `server.fetch()` or extracted handler functions to test `/health` and `404`.

## Task 3: Provider Routes

- [ ] **Step 1: Implement route shape**

Routes:

```text
GET  /health
GET  /providers/capabilities
GET  /providers/:provider/login-status
POST /providers/:provider/logout
GET  /providers/:provider/search?keyword=&limit=
POST /providers/:provider/song-url
POST /providers/:provider/lyric
GET  /providers/:provider/playlists
GET  /providers/:provider/playlists/:id
GET  /diagnostics
GET  /audio-proxy?url=
```

- [ ] **Step 2: Implement placeholder adapters**

Netease adapter may return `NOT_IMPLEMENTED` errors until provider migration task. QQ adapter must return `NOT_IMPLEMENTED` until license review and adapter implementation.

- [ ] **Step 3: Verify error structure**

Tests must confirm unimplemented provider methods still return unified error envelope.

## Task 4: Diagnostics And Logs

- [ ] **Step 1: Implement safe diagnostics**

Diagnostics include:

```json
{
  "appVersion": "0.0.0-dev",
  "apiVersion": "0.1.0",
  "schemaVersion": "0.1.0",
  "providers": [],
  "recentErrors": []
}
```

No cookies or raw auth headers.

- [ ] **Step 2: Verify diagnostics**

Test diagnostics response does not contain `cookie`, `MUSIC_U`, `qm_keyst`, `qqmusic_key`, or `wxskey`.

## Task 5: Verification

- [ ] **Step 1: Run tests**

```powershell
bun test sidecars/api
```

Expected: exits 0.

- [ ] **Step 2: Run dev server**

```powershell
bun run --filter ./sidecars/api dev
```

Expected: logs local address, `/health` responds.

- [ ] **Step 3: Check legacy**

```powershell
node --check server.js
git diff --check
```

Expected: both exit 0.

## Subagent Prompt Summary

Implement Bun sidecar gateway only. Use shared schemas. Keep provider implementations as placeholders unless already planned. Do not copy old server.js. Do not include cookie values in diagnostics. Verify with `bun test sidecars/api`, `/health`, `node --check server.js`, and `git diff --check`.
