import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ESTIMATOR_PATH = "apps/web/src/visual/ai-depth-estimator.ts";
const LICENSE_GATE_PATH = "docs/migration/LICENSE_GATE.md";
const THIRD_PARTY_NOTICES_PATH = "THIRD_PARTY_NOTICES.md";
const PRIVACY_PATH = "PRIVACY.md";
const RELEASE_NOTES_TEMPLATE_PATH = "docs/migration/release-notes-template.md";

const REMOTE_DEPENDENCY = "@xenova/transformers + Xenova/depth-anything-small-hf";
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
const MODEL_ID = "Xenova/depth-anything-small-hf";

export function extractDependencyAuditRow(markdown, dependencyName) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    line.trim() === "| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |"
  );
  if (headerIndex < 0) return null;

  for (const rawLine of lines.slice(headerIndex + 2)) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) break;
    const cells = splitMarkdownTableRow(line);
    if (cells.length < 6) continue;
    if (cells[0] !== dependencyName) continue;
    return {
      dependency: cells[0],
      ecosystem: cells[1],
      license: cells[2],
      purpose: cells[3],
      risk: cells[4],
      decision: cells[5]
    };
  }
  return null;
}

export function evaluateAiDepthRemotePolicy(files) {
  const errors = [];
  const estimatorSource = files.estimatorSource ?? "";
  const licenseGate = files.licenseGate ?? "";
  const thirdPartyNotices = files.thirdPartyNotices ?? "";
  const privacy = files.privacy ?? "";
  const releaseNotesTemplate = files.releaseNotesTemplate ?? "";

  if (!estimatorSource.includes(`TRANSFORMERS_JSDELIVR_URL = "${TRANSFORMERS_URL}"`)) {
    errors.push(`${ESTIMATOR_PATH} must pin transformers.js to ${TRANSFORMERS_URL}`);
  }
  if (!estimatorSource.includes(`AI_DEPTH_MODEL_ID = "${MODEL_ID}"`)) {
    errors.push(`${ESTIMATOR_PATH} must pin the AI depth model to ${MODEL_ID}`);
  }
  if (!estimatorSource.includes("allowLocalModels = false")) {
    errors.push(`${ESTIMATOR_PATH} must disable local model fallback for the reviewed remote path`);
  }
  if (!estimatorSource.includes("numThreads = 1")) {
    errors.push(`${ESTIMATOR_PATH} must keep ONNX WASM single-threaded for WebView2 stability`);
  }

  const row = extractDependencyAuditRow(licenseGate, REMOTE_DEPENDENCY);
  if (!row) {
    errors.push("LICENSE_GATE remote model row is missing");
  } else {
    const licenseText = `${row.license} ${row.risk} ${row.decision}`;
    if (!licenseText.includes("Apache-2.0")) {
      errors.push("LICENSE_GATE remote model row must record Apache-2.0 runtime/base-model license review");
    }
    if (!licenseText.includes("base model") && !licenseText.includes("base_model")) {
      errors.push("LICENSE_GATE remote model row must record the Xenova conversion base_model provenance");
    }
    if (/发布前复核|待审核/.test(licenseText)) {
      errors.push("LICENSE_GATE remote model row must not remain 发布前复核");
    }
    if (!row.decision.includes("通过")) {
      errors.push("LICENSE_GATE remote model row decision must be passing after source review");
    }
  }

  if (!thirdPartyNotices.includes(REMOTE_DEPENDENCY)) {
    errors.push("THIRD_PARTY_NOTICES.md must mention the AI depth remote runtime/model source");
  }
  if (
    !privacy.includes("@xenova/transformers") ||
    !privacy.includes(MODEL_ID) ||
    !privacy.includes("本地 WebView2") ||
    !privacy.includes("不上传封面")
  ) {
    errors.push("PRIVACY.md must explain local WebView2 AI depth inference and no cover upload");
  }
  if (!releaseNotesTemplate.includes("@xenova/transformers") || !releaseNotesTemplate.includes(MODEL_ID)) {
    errors.push("release notes template must disclose the remote AI depth runtime/model download");
  }

  return { ok: errors.length === 0, errors };
}

export function checkAiDepthRemotePolicy(rootDir = process.cwd()) {
  const files = {
    estimatorSource: readRequiredFile(rootDir, ESTIMATOR_PATH),
    licenseGate: readRequiredFile(rootDir, LICENSE_GATE_PATH),
    thirdPartyNotices: readRequiredFile(rootDir, THIRD_PARTY_NOTICES_PATH),
    privacy: readRequiredFile(rootDir, PRIVACY_PATH),
    releaseNotesTemplate: readRequiredFile(rootDir, RELEASE_NOTES_TEMPLATE_PATH)
  };
  return evaluateAiDepthRemotePolicy(files);
}

function readRequiredFile(rootDir, relativePath) {
  const path = resolve(rootDir, relativePath);
  if (!existsSync(path)) throw new Error(`${relativePath} is missing`);
  return readFileSync(path, "utf8");
}

function splitMarkdownTableRow(line) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/`([^`]+)`/g, "$1"));
}

if (import.meta.main) {
  const result = checkAiDepthRemotePolicy(process.cwd());
  if (!result.ok) {
    console.error("AI depth remote policy check failed:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log("AI depth remote policy check passed.");
}
