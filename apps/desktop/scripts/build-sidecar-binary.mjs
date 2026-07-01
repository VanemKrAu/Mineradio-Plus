import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(scriptDir, "..");
const repoRoot = resolve(desktopDir, "../..");
const srcTauriDir = join(desktopDir, "src-tauri");
const binariesDir = join(srcTauriDir, "binaries");
const sidecarBuildDir = join(srcTauriDir, "target", "sidecar-bundle");
const sidecarEntry = join(repoRoot, "sidecars/api/src/server.ts");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function rustHostTriple() {
  const result = spawnSync("rustc", ["-Vv"], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error("rustc -Vv failed; cannot infer Tauri sidecar target triple");
  }
  const hostLine = result.stdout.split(/\r?\n/).find((line) => line.startsWith("host:"));
  const triple = hostLine?.slice("host:".length).trim();
  if (!triple) {
    throw new Error("rustc -Vv did not report a host target triple");
  }
  return triple;
}

await mkdir(binariesDir, { recursive: true });
await rm(sidecarBuildDir, { recursive: true, force: true });
await mkdir(sidecarBuildDir, { recursive: true });

const targetTriple = process.env.TAURI_TARGET_TRIPLE?.trim() || process.env.TARGET?.trim() || rustHostTriple();
const exe = process.platform === "win32" ? ".exe" : "";
const baseBinary = join(binariesDir, `mineradio-sidecar-api${exe}`);
const tauriBinary = join(binariesDir, `mineradio-sidecar-api-${targetTriple}${exe}`);
const bundledEntry = join(sidecarBuildDir, "server.bundle.js");
const windowsCompileArgs = process.platform === "win32" ? ["--windows-hide-console"] : [];

async function patchHanaMusicApiServiceVersion(bundlePath) {
  const hanaEntry = Bun.resolveSync("hana-music-api", sidecarEntry);
  const hanaPackageJsonPath = resolve(dirname(hanaEntry), "..", "package.json");
  const hanaPackageJson = JSON.parse(await readFile(hanaPackageJsonPath, "utf8"));
  const version = hanaPackageJson.version;
  if (typeof version !== "string" || version.length === 0) {
    throw new Error(`hana-music-api package version missing in ${hanaPackageJsonPath}`);
  }

  let source = await readFile(bundlePath, "utf8");
  const packagePathPattern = /\bPACKAGE_JSON_PATH\s*=\s*resolvePackageJsonPath\(\);/g;
  const serviceVersionPattern = /\bSERVICE_VERSION\s*=\s*readServiceVersion\(\);/g;
  const packagePathMatches = source.match(packagePathPattern);
  const serviceVersionMatches = source.match(serviceVersionPattern);
  if (!packagePathMatches?.length || !serviceVersionMatches?.length) {
    throw new Error("hana-music-api service metadata pattern not found in sidecar bundle");
  }

  // Bun 编译后的虚拟路径没有真实 package.json；这里把库的版本探测固定为构建期常量。
  source = source
    .replace(packagePathPattern, 'PACKAGE_JSON_PATH = "";')
    .replace(serviceVersionPattern, `SERVICE_VERSION = ${JSON.stringify(version)};`);
  await writeFile(bundlePath, source, "utf8");
}

run("bun", [
  "build",
  "--target=bun",
  "--outfile",
  bundledEntry,
  sidecarEntry,
]);

await patchHanaMusicApiServiceVersion(bundledEntry);

run("bun", [
  "build",
  "--compile",
  ...windowsCompileArgs,
  "--target=bun",
  "--no-compile-autoload-dotenv",
  "--no-compile-autoload-bunfig",
  "--outfile",
  baseBinary,
  bundledEntry,
]);

await rename(baseBinary, tauriBinary);
