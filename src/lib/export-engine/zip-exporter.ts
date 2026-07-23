/**
 * export-engine/zip-exporter.ts — Future-ready ZIP Archive Bundle Exporter.
 */

import type { ExportPayload } from "./types";
import { generateCsvReport } from "./csv-exporter";
import { generateJsonReport } from "./json-exporter";
import { generatePdfHtml } from "./pdf-exporter";

export function generateZipReportBundle(payload: ExportPayload): {
  filename: string;
  files: { name: string; content: string; mimeType: string }[];
} {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  
  return {
    filename: `ScopeGuard_Export_Bundle_${timestamp}.zip`,
    files: [
      {
        name: `report.csv`,
        content: generateCsvReport(payload),
        mimeType: "text/csv;charset=utf-8;",
      },
      {
        name: `data.json`,
        content: generateJsonReport(payload),
        mimeType: "application/json",
      },
      {
        name: `document.html`,
        content: generatePdfHtml(payload),
        mimeType: "text/html",
      },
    ],
  };
}
