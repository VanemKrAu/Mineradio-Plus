# React Shell And Zustand Stores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React shell, typed API client boundaries, Tauri invoke wrapper, and initial Zustand stores without migrating full playback or visuals yet.

**Architecture:** React renders the app shell and reads runtime config. Stores own UI state and domain state snapshots. API clients validate sidecar responses with shared zod schemas.

**Tech Stack:** Vite, React, TypeScript, Zustand, zod shared package, Tauri invoke wrapper.

---

## Required Reading

- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/plans/03-shared-contracts.md`
- `docs/migration/plans/05-tauri-runtime.md`

## Preconditions

- `apps/web` builds.
- `packages/shared` exports health and envelope schemas.
- Tauri runtime exposes `get_runtime_config`.

## Files

- Create/modify: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/api/sidecar-client.ts`
- Create: `apps/web/src/tauri/runtime.ts`
- Create: `apps/web/src/stores/playback-store.ts`
- Create: `apps/web/src/stores/provider-store.ts`
- Create: `apps/web/src/stores/visual-store.ts`
- Create: `apps/web/src/stores/shelf-store.ts`
- Create: `apps/web/src/stores/ui-store.ts`
- Create: `apps/web/src/stores/update-store.ts`
- Create tests under `apps/web/src/**/*.test.ts`

## Do Not

- Do not migrate old `public/index.html` wholesale.
- Do not implement per-frame visual logic in React.
- Do not store raw cookies in Zustand.
- Do not hardcode sidecar port.

## Task 1: Runtime And API Client

- [ ] **Step 1: Implement runtime wrapper**

`apps/web/src/tauri/runtime.ts` exports:

```ts
export type RuntimeConfig = {
  sidecarBaseUrl: string;
  appDataDir: string;
  appVersion: string;
  schemaVersion: string;
};

export async function getRuntimeConfig(): Promise<RuntimeConfig>;
```

In browser-only tests, provide a safe fallback or mock.

- [ ] **Step 2: Implement sidecar client**

`sidecar-client.ts` accepts `baseUrl` and exposes `health()`.

- [ ] **Step 3: Test**

Mock `fetch` and verify `health()` parses shared schema.

## Task 2: Zustand Stores

- [ ] **Step 1: Implement store shells**

Stores include only initial state and actions needed for shell wiring.

- [ ] **Step 2: Persistence schema**

Visual store persistence must use shared zod schema once available. Until then, keep persistence disabled or schema-guarded.

- [ ] **Step 3: Test actions**

Test basic state transitions:

- playback set current track.
- provider set status.
- ui open/close modal.
- update set status.

## Task 3: App Shell

- [ ] **Step 1: Render shell**

Render:

- title.
- sidecar status.
- provider status placeholder.
- playback placeholder.
- visual host placeholder.

- [ ] **Step 2: Connect runtime health**

On mount, load runtime config and sidecar health. Show loading, connected, and error states.

- [ ] **Step 3: Verify**

```powershell
bun test apps/web
bun run --filter ./apps/web build
```

Expected: both exit 0.

## Subagent Prompt Summary

Implement React shell and stores only. No full playback, no full visual migration, no provider protocol logic. Runtime config must not hardcode sidecar port. Verify tests and web build.
