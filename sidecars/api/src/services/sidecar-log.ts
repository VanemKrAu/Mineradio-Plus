import { mkdir, readFile, stat, writeFile, appendFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface SidecarLogEntry {
  ts: string;
  event: string;
  [key: string]: unknown;
}

export interface SidecarLogger {
  log(entry: Record<string, unknown>): Promise<void>;
}

export interface SidecarLoggerOptions {
  filePath?: string | null;
  maxBytes?: number;
  now?: () => string;
}

const DEFAULT_MAX_BYTES = 1024 * 1024;
const REDACTED = "[redacted]";
const SENSITIVE_KEY_RE = /cookie|authorization|auth|token|music_u|qm_keyst|qqmusic_key|wxskey|uin|csrf/i;
const SENSITIVE_VALUE_RE = /MUSIC_U|qm_keyst|qqmusic_key|wxskey|authorization|bearer\s+|cookie\s*[:=]|__csrf/i;

export function sidecarLogFile(): string | null {
  const raw = process.env.MINERADIO_SIDECAR_LOG_FILE;
  if (!raw || !raw.trim()) return null;
  return raw;
}

export function createSidecarLogger(opts: SidecarLoggerOptions = {}): SidecarLogger {
  const filePath = opts.filePath === undefined ? sidecarLogFile() : opts.filePath;
  return {
    async log(entry: Record<string, unknown>) {
      if (!filePath) return;
      await appendSidecarLog(filePath, entry, opts);
    }
  };
}

export async function appendSidecarLog(
  filePath: string,
  entry: Record<string, unknown>,
  opts: SidecarLoggerOptions = {}
): Promise<void> {
  const maxBytes = Math.max(1, Math.floor(opts.maxBytes ?? DEFAULT_MAX_BYTES));
  const now = opts.now ?? (() => new Date().toISOString());
  const safeEntry = redactLogValue(entry) as Record<string, unknown>;
  const line = JSON.stringify({
    ts: now(),
    ...safeEntry
  }) + "\n";
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, line, "utf8");
  await trimLogFile(filePath, maxBytes);
}

export function redactLogValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactLogValue(item));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(key)) {
        out.redacted = REDACTED;
      } else {
        out[key] = redactLogValue(nested);
      }
    }
    return out;
  }
  if (typeof value === "string") {
    if (SENSITIVE_VALUE_RE.test(value)) return REDACTED;
    return value;
  }
  return value;
}

async function trimLogFile(filePath: string, maxBytes: number): Promise<void> {
  let info;
  try {
    info = await stat(filePath);
  } catch {
    return;
  }
  if (info.size <= maxBytes) return;
  const text = await readFile(filePath, "utf8");
  const lines = text.trimEnd().split("\n");
  const kept: string[] = [];
  let size = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const lineSize = new TextEncoder().encode(line + "\n").byteLength;
    if (kept.length > 0 && size + lineSize > maxBytes) break;
    kept.push(line);
    size += lineSize;
    if (size >= maxBytes) break;
  }
  kept.reverse();
  await writeFile(filePath, kept.join("\n") + (kept.length ? "\n" : ""), "utf8");
}
