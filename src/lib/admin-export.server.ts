/**
 * admin-export.server.ts — Export Usage (Phase 7).
 *
 * This does NOT duplicate any data-fetching logic: it calls the admin
 * read functions already built in earlier phases (listAllUsers,
 * listAuditLogs, listFeatureFlags, getAiUsageMetrics, getSystemMetrics)
 * and just reshapes each result into a flat { headers, records } table,
 * ready for the existing recordsToCsv() exporter (export-engine/csv-exporter.ts)
 * to turn into CSV on the client — exactly the same primitive the rest of
 * the app's export feature uses, just called directly instead of through
 * the project/analysis-specific ExportPayload union (which has no shape
 * for admin-wide tabular data like this).
 *
 * PDF: the project's existing PDF generator (export-engine/pdf-exporter.ts)
 * is written entirely around ExportPayload's project/analysis/dashboard
 * report layouts (KPI cards, table of contents, etc.). Reusing it for flat
 * admin tables would mean extending that shared payload/type union and its
 * large template switch — real duplication risk and shared-file conflict
 * risk, not "reuse". Per the instruction to prefer CSV, PDF export is not
 * implemented in this phase; CSV covers every dataset below.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./authorize.server";
import { AppError } from "./app-error";
import { listAllUsers } from "./users-admin.server";
import { listAuditLogs } from "./audit-log.server";
import { listFeatureFlags } from "./feature-flags.server";
import { getAiUsageMetrics } from "./ai-usage.server";
import { getSystemMetrics } from "./system-metrics.server";

export type AdminExportDataset =
  "users" | "audit_logs" | "feature_flags" | "ai_usage" | "system_metrics";

export type AdminExportTable = {
  dataset: AdminExportDataset;
  headers: { key: string; label: string }[];
  records: Record<string, string | number | boolean | null | undefined>[];
};

const DATASETS: { value: AdminExportDataset; label: string }[] = [
  { value: "users", label: "Users" },
  { value: "audit_logs", label: "Audit Logs" },
  { value: "feature_flags", label: "Feature Flags" },
  { value: "ai_usage", label: "AI Usage" },
  { value: "system_metrics", label: "System Metrics" },
];

/** Returns the list of exportable admin datasets, for the picker UI. */
export const listExportableDatasets = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  return DATASETS;
});

const getExportSchema = z.object({
  dataset: z.enum(["users", "audit_logs", "feature_flags", "ai_usage", "system_metrics"]),
});

export const getAdminExportData = createServerFn({ method: "POST" })
  .validator((data: unknown) => getExportSchema.parse(data))
  .handler(async ({ data }): Promise<AdminExportTable> => {
    await requireAdmin();

    switch (data.dataset) {
      case "users": {
        const users = await listAllUsers();
        return {
          dataset: "users",
          headers: [
            { key: "id", label: "User ID" },
            { key: "email", label: "Email" },
            { key: "firstName", label: "First Name" },
            { key: "lastName", label: "Last Name" },
            { key: "workspaceName", label: "Workspace" },
            { key: "role", label: "Role" },
            { key: "isActive", label: "Active" },
            { key: "provider", label: "Provider" },
            { key: "createdAt", label: "Created" },
          ],
          records: users as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >[],
        };
      }

      case "audit_logs": {
        const logs = await listAuditLogs();
        return {
          dataset: "audit_logs",
          headers: [
            { key: "actorEmail", label: "Admin" },
            { key: "action", label: "Action" },
            { key: "targetType", label: "Target Type" },
            { key: "targetId", label: "Target ID" },
            { key: "message", label: "Message" },
            { key: "createdAt", label: "When" },
          ],
          records: logs as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >[],
        };
      }

      case "feature_flags": {
        const flags = await listFeatureFlags();
        return {
          dataset: "feature_flags",
          headers: [
            { key: "key", label: "Key" },
            { key: "label", label: "Label" },
            { key: "description", label: "Description" },
            { key: "enabled", label: "Enabled" },
            { key: "updatedAt", label: "Last Updated" },
          ],
          records: flags as unknown as Record<
            string,
            string | number | boolean | null | undefined
          >[],
        };
      }

      case "ai_usage": {
        const metrics = await getAiUsageMetrics();
        return {
          dataset: "ai_usage",
          headers: [
            { key: "metric", label: "Metric" },
            { key: "value", label: "Value" },
          ],
          records: [
            { metric: "Total requests", value: metrics.totalRequests },
            { metric: "Successful (Gemini)", value: metrics.successfulRequests },
            { metric: "Failed (fell back to rules)", value: metrics.failedRequests },
            { metric: "Success rate (%)", value: metrics.successRate ?? "N/A" },
            { metric: "Avg. response time (ms)", value: metrics.averageResponseTimeMs ?? "N/A" },
            { metric: "Total tokens used", value: metrics.totalTokensUsed },
            {
              metric: "Avg. tokens per request",
              value: metrics.averageTokensPerRequest ?? "N/A",
            },
          ],
        };
      }

      case "system_metrics": {
        const metrics = await getSystemMetrics();
        return {
          dataset: "system_metrics",
          headers: [
            { key: "metric", label: "Metric" },
            { key: "value", label: "Value" },
          ],
          records: [
            { metric: "Total users", value: metrics.totalUsers },
            { metric: "Active users", value: metrics.activeUsers },
            { metric: "Emails processed", value: metrics.totalEmailsProcessed },
            { metric: "AI requests", value: metrics.totalAiRequests },
            { metric: "Notifications", value: metrics.totalNotifications },
            { metric: "Unread notifications", value: metrics.unreadNotifications },
            { metric: "Database status", value: metrics.database.status },
            { metric: "Server uptime (s)", value: metrics.server.uptimeSeconds },
            { metric: "Heap used (MB)", value: metrics.server.memory.heapUsedMb },
            { metric: "Heap total (MB)", value: metrics.server.memory.heapTotalMb },
            { metric: "RSS (MB)", value: metrics.server.memory.rssMb },
            { metric: "CPU load (1 min)", value: metrics.server.loadAverage1m ?? "N/A" },
          ],
        };
      }

      default:
        throw new AppError(400, "Unknown export dataset.");
    }
  });
