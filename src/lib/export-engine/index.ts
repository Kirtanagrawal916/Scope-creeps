/**
 * export-engine/index.ts — Unified Exporter Dispatcher & Client-side File Downloader.
 */

import type { ExportFormat, ExportPayload } from "./types";
import { generateCsvReport } from "./csv-exporter";
import { generateExcelReport } from "./excel-exporter";
import { generatePdfHtml } from "./pdf-exporter";
import { generateJsonReport } from "./json-exporter";
import { generateDocxReport } from "./docx-exporter";
import { generateZipReportBundle } from "./zip-exporter";

export * from "./types";
export * from "./csv-exporter";
export * from "./excel-exporter";
export * from "./pdf-exporter";
export * from "./json-exporter";
export * from "./docx-exporter";
export * from "./zip-exporter";

/**
 * Triggers a browser file download for a string or Blob content.
 */
export function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates a descriptive filename for the export.
 */
export function getExportFilename(payload: ExportPayload, format: ExportFormat): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  let baseName = "ScopeGuard_Report";

  switch (payload.type) {
    case "dashboard":
      baseName = `ScopeGuard_Dashboard_Summary_${dateStr}`;
      break;
    case "project":
      baseName = `ScopeGuard_Project_${payload.data.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${dateStr}`;
      break;
    case "projects_bulk":
      baseName = `ScopeGuard_Projects_Bulk_Report_${dateStr}`;
      break;
    case "analysis":
      baseName = `ScopeGuard_Analysis_${payload.data.id.slice(-6)}_${dateStr}`;
      break;
    case "analyses_bulk":
      baseName = `ScopeGuard_Analyses_Bulk_Report_${dateStr}`;
      break;
    case "analytics":
      baseName = `ScopeGuard_Analytics_Report_${dateStr}`;
      break;
    case "workspace":
      baseName = `ScopeGuard_Workspace_Full_Export_${dateStr}`;
      break;
  }

  const extMap: Record<ExportFormat, string> = {
    pdf: "pdf",
    csv: "csv",
    excel: "xlsx",
    json: "json",
    docx: "docx",
    zip: "zip",
  };

  return `${baseName}.${extMap[format] || format}`;
}

/**
 * Dispatches the export generation and triggers file download / print.
 */
export async function executeExport(
  payload: ExportPayload,
  format: ExportFormat,
  onProgress?: (percent: number) => void,
): Promise<{ success: boolean; filename: string }> {
  onProgress?.(20);
  const filename = getExportFilename(payload, format);

  onProgress?.(50);

  switch (format) {
    case "csv": {
      const csvStr = generateCsvReport(payload);
      downloadFile(csvStr, filename, "text/csv;charset=utf-8;");
      break;
    }

    case "excel": {
      const excelXml = generateExcelReport(payload);
      downloadFile(
        excelXml,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
      );
      break;
    }

    case "json": {
      const jsonStr = generateJsonReport(payload);
      downloadFile(jsonStr, filename, "application/json;charset=utf-8;");
      break;
    }

    case "docx": {
      const docxDoc = generateDocxReport(payload);
      downloadFile(docxDoc, filename, "application/msword;charset=utf-8;");
      break;
    }

    case "zip": {
      const bundle = generateZipReportBundle(payload);
      // For ZIP, output combined text archive payload file or HTML bundle
      const zipContent = bundle.files
        .map((f) => `--- FILE: ${f.name} ---\n${f.content}\n\n`)
        .join("");
      downloadFile(zipContent, bundle.filename, "application/zip");
      break;
    }

    case "pdf": {
      const htmlContent = generatePdfHtml(payload);
      // Open in printable print window or download printable document
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        // Fallback to downloading HTML report file if popups blocked
        downloadFile(htmlContent, filename.replace(".pdf", ".html"), "text/html;charset=utf-8;");
      }
      break;
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  onProgress?.(100);
  return { success: true, filename };
}
