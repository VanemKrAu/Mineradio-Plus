import { describe, expect, test } from "bun:test";

import {
  checkAiDepthRemotePolicy,
  evaluateAiDepthRemotePolicy,
  extractDependencyAuditRow
} from "./check-ai-depth-remote-policy.mjs";

describe("AI depth remote model policy check", () => {
  test("extracts dependency audit rows by dependency name", () => {
    const row = extractDependencyAuditRow(
      `
| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| @xenova/transformers + Xenova/depth-anything-small-hf | remote runtime/model source | runtime Apache-2.0; base model Apache-2.0 | depth | reviewed | 通过（remote source reviewed） |
`,
      "@xenova/transformers + Xenova/depth-anything-small-hf"
    );

    expect(row?.license).toContain("Apache-2.0");
    expect(row?.decision).toContain("remote source reviewed");
  });

  test("requires the reviewed jsDelivr runtime, HuggingFace model, notices, and privacy wording", () => {
    const result = evaluateAiDepthRemotePolicy({
      estimatorSource: `
export const TRANSFORMERS_JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
export const AI_DEPTH_MODEL_ID = "Xenova/depth-anything-small-hf";
mod.env.allowLocalModels = false;
wasm.numThreads = 1;
`,
      licenseGate: `
| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| @xenova/transformers + Xenova/depth-anything-small-hf | remote runtime/model source | Runtime Apache-2.0; base model Apache-2.0; Xenova ONNX conversion records base_model=LiheYoung/depth-anything-small-hf | AI depth baseline parity | Exact jsDelivr/HuggingFace allowlist only; inference stays local | 通过（remote source reviewed; WebView2 runtime evidence pending） |
`,
      thirdPartyNotices: "@xenova/transformers + Xenova/depth-anything-small-hf Apache-2.0 remote runtime/model",
      privacy: "@xenova/transformers Xenova/depth-anything-small-hf 本地 WebView2 推理 不上传封面",
      releaseNotesTemplate: "@xenova/transformers Xenova/depth-anything-small-hf remote runtime/model"
    });

    expect(result).toEqual({ ok: true, errors: [] });
  });

  test("fails when the remote model policy is still pending or privacy wording is missing", () => {
    const result = evaluateAiDepthRemotePolicy({
      estimatorSource: `
export const TRANSFORMERS_JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
export const AI_DEPTH_MODEL_ID = "Xenova/depth-anything-small-hf";
allowLocalModels = false;
numThreads = 1;
`,
      licenseGate: `
| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| @xenova/transformers + Xenova/depth-anything-small-hf | remote runtime/model source | 发布前复核 | AI depth | pending | 记录（source allowance；公开发布前复核） |
`,
      thirdPartyNotices: "",
      privacy: "",
      releaseNotesTemplate: ""
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("LICENSE_GATE remote model row must record Apache-2.0 runtime/base-model license review");
    expect(result.errors).toContain("LICENSE_GATE remote model row must not remain 发布前复核");
    expect(result.errors).toContain("THIRD_PARTY_NOTICES.md must mention the AI depth remote runtime/model source");
    expect(result.errors).toContain("PRIVACY.md must explain local WebView2 AI depth inference and no cover upload");
    expect(result.errors).toContain("release notes template must disclose the remote AI depth runtime/model download");
  });

  test("passes against the repository policy files", () => {
    const result = checkAiDepthRemotePolicy(process.cwd());

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
