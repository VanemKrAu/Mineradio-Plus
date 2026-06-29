import type { CapabilityMatrix, ProviderStatusEntry } from "@mineradio/shared";
import { appVersion, apiVersion, schemaVersion } from "../env";
import { buildCapabilityMatrix } from "../providers/registry";
import { redactLogValue, sidecarLogFile } from "./sidecar-log";

const RECENT_ERRORS_MAX = 20;
const recentErrors: unknown[] = [];

export interface DiagnosticsDeps {
  capabilityMatrix?: () => CapabilityMatrix;
  sidecarLogFile?: () => string | null;
}

export interface DiagnosticsLogPointers {
  sidecarRuntimeLog: string | null;
}

export interface DiagnosticsPayload {
  ok: true;
  appVersion: string;
  apiVersion: string;
  schemaVersion: string;
  providers: ProviderStatusEntry[];
  recentErrors: unknown[];
  logPointers: DiagnosticsLogPointers;
}

export function buildDiagnostics(deps: DiagnosticsDeps = {}): DiagnosticsPayload {
  const matrix = deps.capabilityMatrix ? deps.capabilityMatrix() : buildCapabilityMatrix();
  const logFile = deps.sidecarLogFile ? deps.sidecarLogFile() : sidecarLogFile();
  return {
    ok: true,
    appVersion: appVersion(),
    apiVersion: apiVersion(),
    schemaVersion: schemaVersion(),
    providers: matrix.providers,
    recentErrors: recentErrors.map((entry) => redactLogValue(entry)),
    logPointers: {
      sidecarRuntimeLog: sanitizeLogPointer(logFile)
    }
  };
}

export function pushRecentError(entry: unknown): void {
  recentErrors.push(entry);
  if (recentErrors.length > RECENT_ERRORS_MAX) {
    recentErrors.shift();
  }
}

function sanitizeLogPointer(pointer: string | null): string | null {
  if (!pointer) return null;
  const redacted = redactLogValue(pointer);
  return typeof redacted === "string" ? redacted : null;
}
