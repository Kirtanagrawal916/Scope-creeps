/**
 * export-engine/json-exporter.ts — Structured JSON Exporter for Data Portability.
 */

import type { ExportPayload } from "./types";

export function generateJsonReport(payload: ExportPayload): string {
  const jsonObject = {
    schemaVersion: "1.0",
    exporter: "ScopeGuard Production Export Engine",
    exportedAt: new Date().toISOString(),
    payloadType: payload.type,
    data: payload.data,
  };

  return JSON.stringify(jsonObject, null, 2);
}
