/**
 * export-engine/csv-exporter.ts — CSV Report Exporter with UTF-8 BOM & RFC-4180 escaping.
 */

import type { ExportPayload } from "./types";

/**
 * Escapes a single CSV value according to RFC 4180 rules.
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Replace internal quotes with double quotes
  str = str.replace(/"/g, '""');
  // If string contains comma, quote, or newline, wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str}"`;
  }
  return `"${str}"`;
}

/**
 * Converts a list of records (objects) to a CSV string.
 */
export function recordsToCsv<T extends Record<string, unknown>>(
  headers: { key: keyof T; label: string }[],
  records: T[],
): string {
  const headerRow = headers.map((h) => escapeCsvField(h.label)).join(",");
  const dataRows = records.map((record) =>
    headers.map((h) => escapeCsvField(record[h.key])).join(","),
  );
  // Add UTF-8 BOM prefix for Excel compatibility
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Generates a complete CSV report for any payload type.
 */
export function generateCsvReport(payload: ExportPayload): string {
  switch (payload.type) {
    case "dashboard": {
      const data = payload.data;
      const metaRow = `"# ScopeGuard Dashboard Summary Report"`;
      const metaRow2 = `"Workspace: ${data.meta.workspaceName}","Generated: ${data.meta.generatedAt}"`;
      const emptyRow = `""`;

      const statsHeaders = ["Metric", "Value"];
      const statsRows = [
        `"Total Projects",${data.stats.totalProjects}`,
        `"Total Analyses",${data.stats.totalAnalyses}`,
        `"Scope Creep Count",${data.stats.scopeCreepCount}`,
        `"Revenue Protected ($)",${data.stats.revenueProtected}`,
        `"Hours Saved",${data.stats.hoursSaved}`,
        `"Average Confidence (%)",${data.stats.avgConfidence}`,
        `"High Risk Projects",${data.stats.highRiskProjectsCount}`,
      ];

      const scopeChangesHeaders = [
        { key: "projectName", label: "Project Name" },
        { key: "originalRequirement", label: "Original Requirement" },
        { key: "changedRequirement", label: "Changed Requirement" },
        { key: "verdict", label: "Verdict" },
        { key: "riskLevel", label: "Risk Level" },
        { key: "additionalHours", label: "Additional Hours" },
        { key: "suggestedCost", label: "Suggested Cost ($)" },
        { key: "createdAt", label: "Date" },
      ];
      const scopeChangesCsv = recordsToCsv(
        scopeChangesHeaders,
        data.recentScopeChanges as unknown as Record<string, unknown>[],
      );

      return [
        metaRow,
        metaRow2,
        emptyRow,
        `"# KPI Statistics"`,
        ...statsHeaders,
        ...statsRows,
        emptyRow,
        `"# Recent Scope Changes"`,
        scopeChangesCsv,
      ].join("\r\n");
    }

    case "analysis": {
      const item = payload.data;
      const headers = [
        { key: "id", label: "Analysis ID" },
        { key: "projectName", label: "Project" },
        { key: "clientName", label: "Client" },
        { key: "verdict", label: "Verdict" },
        { key: "confidence", label: "Confidence (%)" },
        { key: "riskLevel", label: "Risk Level" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "additionalHours", label: "Est. Additional Hours" },
        { key: "suggestedCost", label: "Est. Suggested Cost ($)" },
        { key: "aiModel", label: "AI Model" },
        { key: "isFallback", label: "Is Fallback" },
        { key: "aiSummary", label: "AI Summary" },
        { key: "explanation", label: "AI Explanation" },
        { key: "originalRequirement", label: "Original Requirement" },
        { key: "changedRequirement", label: "Changed Requirement" },
        { key: "includedFeatures", label: "Included Features" },
        { key: "outOfScopeFeatures", label: "Out of Scope Features" },
        { key: "suggestedReply", label: "Suggested Reply" },
        { key: "createdAt", label: "Created Date" },
      ];

      const record = {
        ...item,
        includedFeatures: item.includedFeatures?.join("; ") ?? "",
        outOfScopeFeatures: item.outOfScopeFeatures?.join("; ") ?? "",
      };

      return recordsToCsv(headers, [record as unknown as Record<string, unknown>]);
    }

    case "analyses_bulk": {
      const items = payload.data;
      const headers = [
        { key: "id", label: "Analysis ID" },
        { key: "projectName", label: "Project" },
        { key: "clientName", label: "Client" },
        { key: "verdict", label: "Verdict" },
        { key: "confidence", label: "Confidence (%)" },
        { key: "riskLevel", label: "Risk Level" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "additionalHours", label: "Est. Hours" },
        { key: "suggestedCost", label: "Est. Cost ($)" },
        { key: "aiSummary", label: "AI Summary" },
        { key: "originalRequirement", label: "Original Requirement" },
        { key: "changedRequirement", label: "Changed Requirement" },
        { key: "createdAt", label: "Created Date" },
      ];

      return recordsToCsv(headers, items as unknown as Record<string, unknown>[]);
    }

    case "project": {
      const proj = payload.data;
      const headers = [
        { key: "id", label: "Project ID" },
        { key: "name", label: "Project Name" },
        { key: "client", label: "Client" },
        { key: "status", label: "Status" },
        { key: "risk", label: "Risk" },
        { key: "budget", label: "Budget ($)" },
        { key: "hourlyRate", label: "Hourly Rate ($)" },
        { key: "hoursAllocated", label: "Hours Allocated" },
        { key: "hoursUsed", label: "Hours Used" },
        { key: "progress", label: "Progress (%)" },
        { key: "createdAt", label: "Created Date" },
      ];

      const projectCsv = recordsToCsv(headers, [proj as unknown as Record<string, unknown>]);
      const emptyRow = `""`;
      const analysesHeaders = [
        { key: "id", label: "Analysis ID" },
        { key: "verdict", label: "Verdict" },
        { key: "confidence", label: "Confidence (%)" },
        { key: "riskLevel", label: "Risk Level" },
        { key: "additionalHours", label: "Est. Hours" },
        { key: "suggestedCost", label: "Est. Cost ($)" },
        { key: "aiSummary", label: "AI Summary" },
        { key: "createdAt", label: "Date" },
      ];

      const analysesCsv = recordsToCsv(
        analysesHeaders,
        proj.analyses as unknown as Record<string, unknown>[],
      );

      return [
        `"# Project Summary Report"`,
        projectCsv,
        emptyRow,
        `"# Associated Scope Analyses"`,
        analysesCsv,
      ].join("\r\n");
    }

    case "projects_bulk": {
      const projects = payload.data;
      const headers = [
        { key: "id", label: "Project ID" },
        { key: "name", label: "Project Name" },
        { key: "client", label: "Client" },
        { key: "status", label: "Status" },
        { key: "risk", label: "Risk Rating" },
        { key: "budget", label: "Budget ($)" },
        { key: "hourlyRate", label: "Hourly Rate ($)" },
        { key: "hoursAllocated", label: "Hours Allocated" },
        { key: "hoursUsed", label: "Hours Used" },
        { key: "progress", label: "Progress (%)" },
        { key: "createdAt", label: "Created Date" },
      ];

      return recordsToCsv(headers, projects as unknown as Record<string, unknown>[]);
    }

    case "analytics": {
      const data = payload.data;
      const headers = ["Metric", "Value"];
      const kpiRows = [
        `"Total Revenue Protected ($)",${data.kpis.totalRevenueProtected}`,
        `"Total Hours Saved",${data.kpis.totalHoursSaved}`,
        `"Average Confidence Score (%)",${data.kpis.avgConfidenceScore}`,
        `"Total Analyses Performed",${data.kpis.totalAnalysesPerformed}`,
        `"Scope Creep Ratio (%)",${data.kpis.scopeCreepRatio}`,
      ];

      const monthlyHeaders = [
        { key: "month", label: "Month" },
        { key: "totalAnalyses", label: "Total Analyses" },
        { key: "scopeCreepCount", label: "Scope Creep Count" },
        { key: "revenueProtected", label: "Revenue Protected ($)" },
      ];
      const monthlyCsv = recordsToCsv(
        monthlyHeaders,
        data.monthlyActivity as unknown as Record<string, unknown>[],
      );

      return [
        `"# ScopeGuard Analytics Report"`,
        `"Generated: ${data.meta.generatedAt}"`,
        `""`,
        `"# Key Performance Indicators"`,
        ...headers,
        ...kpiRows,
        `""`,
        `"# Monthly Trends"`,
        monthlyCsv,
      ].join("\r\n");
    }

    case "workspace": {
      const data = payload.data;
      return generateCsvReport({ type: "dashboard", data: data.dashboard });
    }

    default:
      return "";
  }
}
