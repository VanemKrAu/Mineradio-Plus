# Workspace And Tauri Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first runnable Bun workspace, Tauri desktop shell, Vite React app, shared package, visual-engine package, and health-only Bun sidecar without migrating business features.

**Architecture:** Keep Electron baseline in place. Add the new Tauri/Bun/React structure in parallel. Rust starts a shell app, React renders a minimal runtime status page, and Bun sidecar exposes `/health`.

**Tech Stack:** Bun workspace, Tauri 2, Rust, Vite, TypeScript, React, zod placeholder package, Bun HTTP sidecar.

---

## Required Reading

- `AGENTS.md`
- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/DESIGN_TAURI_REWRITE.md`
- `docs/migration/EXECUTION_PROTOCOL.md`
- `docs/migration/plans/01-baseline-freeze.md`

## Preconditions

- Baseline freeze documentation exists.
- Work is happening in an isolated worktree.
- No public release gate is being claimed.

## Files

- Modify: `package.json`
- Modify: `.gitignore`
- Create: `apps/desktop/`
- Create: `apps/web/`
- Create: `sidecars/api/`
- Create: `packages/shared/`
- Create: `packages/visual-engine/`
- Create: `bun.lock`

## Do Not

- Do not move `public/`, `desktop/`, or `server.js`.
- Do not remove Electron scripts yet.
- Do not migrate provider logic.
- Do not copy old `server.js` into sidecar.
- Do not reuse `com.mineradio.desktop` as the Tauri app id.
- Do not use old Electron update or NSIS settings as the new Tauri release source.

## Task 1: Prepare Workspace Metadata

- [ ] **Step 1: Modify root `package.json`**

Keep existing Electron scripts available and add workspace fields. The root should include:

```json
{
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "sidecars/*"
  ],
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win nsis",
    "build:win:dir": "electron-builder --win dir",
    "tauri:dev": "bun run --filter ./apps/desktop tauri dev",
    "tauri:build": "bun run --filter ./apps/desktop tauri build",
    "web:build": "bun run --filter ./apps/web build",
    "sidecar:dev": "bun run --filter ./sidecars/api dev"
  }
}
```

Preserve existing fields not shown here. Do not delete Electron config.

- [ ] **Step 2: Update `.gitignore`**

Add ignore entries for generated outputs:

```gitignore
# Tauri / Bun workspace outputs
apps/*/dist/
apps/*/node_modules/
packages/*/dist/
sidecars/*/dist/
target/
.worktrees/
```

Keep `bun.lock` tracked.

- [ ] **Step 3: Verify root metadata**

Run:

```powershell
git diff -- package.json .gitignore
```

Expected: Electron scripts remain; workspace scripts are additive.

## Task 2: Create Shared And Visual Packages

- [ ] **Step 1: Create `packages/shared/package.json`**

Use:

```json
{
  "name": "@mineradio/shared",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/shared/src/index.ts`**

Use:

```ts
import { z } from "zod";

export const HealthResponseSchema = z.object({
  ok: z.literal(true),
  appVersion: z.string(),
  apiVersion: z.string(),
  schemaVersion: z.string(),
  providers: z.array(z.string())
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
```

- [ ] **Step 3: Create `packages/visual-engine/package.json`**

Use:

```json
{
  "name": "@mineradio/visual-engine",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 4: Create `packages/visual-engine/src/index.ts`**

Use:

```ts
export type VisualEngineSnapshot = {
  preset: string;
  playing: boolean;
};

export type VisualEngine = {
  update(snapshot: VisualEngineSnapshot): void;
  resize(size: { width: number; height: number }): void;
  dispose(): void;
};

export function createVisualEngine(): VisualEngine {
  return {
    update() {},
    resize() {},
    dispose() {}
  };
}
```

## Task 3: Create Health-Only Bun Sidecar

- [ ] **Step 1: Create `sidecars/api/package.json`**

Use:

```json
{
  "name": "@mineradio/sidecar-api",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun run src/server.ts",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mineradio/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `sidecars/api/src/server.ts`**

Use:

```ts
import { HealthResponseSchema } from "@mineradio/shared";

const port = Number(process.env.MINERADIO_SIDECAR_PORT || "0");
const hostname = "127.0.0.1";

const server = Bun.serve({
  hostname,
  port,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      const body = HealthResponseSchema.parse({
        ok: true,
        appVersion: process.env.MINERADIO_APP_VERSION || "0.0.0-dev",
        apiVersion: "0.1.0",
        schemaVersion: "0.1.0",
        providers: []
      });
      return Response.json(body);
    }
    return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "Not found", retryable: false } }, { status: 404 });
  }
});

console.log(`[sidecar] listening on http://${server.hostname}:${server.port}`);
```

- [ ] **Step 3: Create `sidecars/api/src/server.test.ts`**

Use a schema-only test:

```ts
import { expect, test } from "bun:test";
import { HealthResponseSchema } from "@mineradio/shared";

test("health response schema accepts the sidecar shape", () => {
  const parsed = HealthResponseSchema.parse({
    ok: true,
    appVersion: "0.0.0-dev",
    apiVersion: "0.1.0",
    schemaVersion: "0.1.0",
    providers: []
  });
  expect(parsed.ok).toBe(true);
});
```

## Task 4: Create Vite React Shell

- [ ] **Step 1: Create `apps/web/package.json`**

Use Vite React dependencies and workspace dependency on shared/visual packages.

- [ ] **Step 2: Create minimal React app**

The app should render:

```text
Tauri Rewrite Shell
Sidecar: not connected
Visual Engine: placeholder
```

- [ ] **Step 3: Verify web build**

Run:

```powershell
bun run --filter ./apps/web build
```

Expected: exits 0.

## Task 5: Create Tauri Desktop Shell

- [ ] **Step 1: Scaffold Tauri 2 app in `apps/desktop`**

Use official Tauri 2 scaffolding, selecting the existing `apps/web` frontend path where possible. Use a new app id such as:

```text
com.mineradio.fork.tauri
```

Do not use:

```text
com.mineradio.desktop
```

- [ ] **Step 2: Configure dev/build scripts**

`apps/desktop/package.json` must expose:

```json
{
  "scripts": {
    "tauri": "tauri"
  }
}
```

- [ ] **Step 3: Verify Tauri dev shell**

Run:

```powershell
bun run --filter ./apps/desktop tauri dev
```

Expected: Tauri window opens and displays the React shell.

## Task 6: Full Verification

- [ ] **Step 1: Install dependencies**

Run:

```powershell
bun install
```

Expected: exits 0 and creates/updates `bun.lock`.

- [ ] **Step 2: Run package tests**

Run:

```powershell
bun run --filter ./packages/shared test
bun run --filter ./packages/visual-engine test
bun run --filter ./sidecars/api test
```

Expected: all exit 0.

- [ ] **Step 3: Run web build**

Run:

```powershell
bun run --filter ./apps/web build
```

Expected: exits 0.

- [ ] **Step 4: Run Rust tests**

Run from `apps/desktop/src-tauri`:

```powershell
cargo test
```

Expected: exits 0.

- [ ] **Step 5: Legacy syntax check still passes**

Run:

```powershell
node --check server.js
git diff --check
```

Expected: both exit 0.

## Rollback

If scaffolding fails before meaningful implementation:

- Remove `apps/`
- Remove `packages/`
- Remove `sidecars/`
- Restore root `package.json`
- Restore `.gitignore`
- Remove `bun.lock`

Do not alter Electron baseline files.

## Subagent Prompt Summary

Create only the workspace and health-only shell. Preserve Electron baseline. Do not migrate providers, UI, visual engine internals, updater, or desktop lyrics. Use a new app id. Run all verification commands and report exact failures.
