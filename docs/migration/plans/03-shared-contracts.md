# Shared Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the shared TypeScript and zod contract package used by React, Bun sidecar, and Tauri-facing API wrappers.

**Architecture:** `packages/shared` is platform-neutral. It exports zod schemas, inferred types, provider capability definitions, API envelopes, and persistence schemas without depending on React, Tauri, Bun server APIs, Node filesystem, or browser globals.

**Tech Stack:** TypeScript, zod, Bun test.

---

## Required Reading

- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/EXECUTION_PROTOCOL.md`
- `docs/migration/plans/02-workspace-tauri-shell.md`

## Preconditions

- Bun workspace exists.
- `packages/shared` exists with a package manifest.
- Work is in isolated worktree.

## Files

- Create/modify: `packages/shared/src/envelope.ts`
- Create/modify: `packages/shared/src/provider.ts`
- Create/modify: `packages/shared/src/track.ts`
- Create/modify: `packages/shared/src/playlist.ts`
- Create/modify: `packages/shared/src/lyric.ts`
- Create/modify: `packages/shared/src/health.ts`
- Create/modify: `packages/shared/src/persistence.ts`
- Create/modify: `packages/shared/src/capabilities.ts`
- Create/modify: `packages/shared/src/index.ts`
- Create: `packages/shared/src/*.test.ts`

## Do Not

- Do not import React.
- Do not import Tauri APIs.
- Do not import Bun server APIs.
- Do not read or write files.
- Do not encode Netease-only or QQ-only UI behavior into shared types.

## Task 1: API Envelope

- [ ] **Step 1: Write failing tests**

Create `packages/shared/src/envelope.test.ts`:

```ts
import { expect, test } from "bun:test";
import { ApiFailureSchema, ApiSuccessSchema } from "./envelope";

test("success envelope parses typed data", () => {
  const parsed = ApiSuccessSchema({ name: "demo" }).parse({
    ok: true,
    data: { name: "track" }
  });
  expect(parsed.data.name).toBe("track");
});

test("failure envelope requires code, message and retryable", () => {
  const parsed = ApiFailureSchema.parse({
    ok: false,
    error: {
      code: "LOGIN_REQUIRED",
      message: "Login required",
      provider: "netease",
      retryable: true,
      action: "login"
    }
  });
  expect(parsed.error.action).toBe("login");
});
```

- [ ] **Step 2: Run failing test**

```powershell
bun test packages/shared/src/envelope.test.ts
```

Expected: fails because `envelope.ts` does not exist or exports are missing.

- [ ] **Step 3: Implement `envelope.ts`**

```ts
import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  provider: z.string().optional(),
  retryable: z.boolean(),
  action: z.string().optional()
});

export const ApiFailureSchema = z.object({
  ok: z.literal(false),
  error: ApiErrorSchema
});

export function ApiSuccessSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    ok: z.literal(true),
    data
  });
}

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiFailure = z.infer<typeof ApiFailureSchema>;
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

- [ ] **Step 4: Verify**

```powershell
bun test packages/shared/src/envelope.test.ts
```

Expected: exits 0.

## Task 2: Provider And Track Schemas

- [ ] **Step 1: Create tests**

Create `packages/shared/src/track.test.ts`:

```ts
import { expect, test } from "bun:test";
import { TrackSchema } from "./track";

test("track schema parses unified provider track", () => {
  const track = TrackSchema.parse({
    provider: "netease",
    id: "123",
    sourceId: "123",
    title: "Song",
    artists: ["Artist"],
    album: "Album",
    coverUrl: "https://example.com/cover.jpg",
    durationMs: 210000,
    qualityHints: ["standard", "lossless"],
    playableState: "unknown"
  });
  expect(track.provider).toBe("netease");
});
```

- [ ] **Step 2: Implement `provider.ts`**

```ts
import { z } from "zod";

export const ProviderIdSchema = z.enum(["netease", "qq"]);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const ProviderCapabilitySchema = z.enum([
  "search",
  "songUrl",
  "lyric",
  "playlistList",
  "playlistDetail",
  "loginStatus",
  "logout",
  "like",
  "comment",
  "podcast",
  "quality"
]);

export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
```

- [ ] **Step 3: Implement `track.ts`**

```ts
import { z } from "zod";
import { ProviderIdSchema } from "./provider";

export const PlayableStateSchema = z.enum([
  "unknown",
  "playable",
  "login_required",
  "vip_required",
  "paid_required",
  "copyright_unavailable",
  "trial_only",
  "unavailable"
]);

export const TrackSchema = z.object({
  provider: ProviderIdSchema,
  id: z.string().min(1),
  sourceId: z.string().min(1),
  title: z.string(),
  artists: z.array(z.string()),
  album: z.string().optional().default(""),
  coverUrl: z.string().optional().default(""),
  durationMs: z.number().int().nonnegative().optional(),
  qualityHints: z.array(z.string()).default([]),
  playableState: PlayableStateSchema.default("unknown")
});

export type PlayableState = z.infer<typeof PlayableStateSchema>;
export type Track = z.infer<typeof TrackSchema>;
```

- [ ] **Step 4: Verify**

```powershell
bun test packages/shared/src/track.test.ts
```

Expected: exits 0.

## Task 3: Playlist, Lyric, Health, Persistence, Capabilities

- [ ] **Step 1: Implement schemas**

Create schemas with these required exports:

```text
PlaylistSummarySchema
PlaylistDetailSchema
LyricLineSchema
LyricPayloadSchema
HealthResponseSchema
PersistedVisualStateSchema
ProviderStatusSchema
CapabilityMatrixSchema
```

- [ ] **Step 2: Export from `index.ts`**

`packages/shared/src/index.ts` must export every schema and type from all modules.

- [ ] **Step 3: Add tests**

Add at least one parse success and one parse failure test for health and capability matrix.

- [ ] **Step 4: Verify**

```powershell
bun test packages/shared
bun run --filter ./packages/shared typecheck
```

Expected: both exit 0.

## Subagent Prompt Summary

Implement platform-neutral shared zod contracts only. Do not create sidecar routes, React components, or Tauri commands. Tests must prove success and failure parsing. Run `bun test packages/shared` and `bun run --filter ./packages/shared typecheck`.
