/**
 * api-metrics.server.ts — API Metrics (Phase 8).
 *
 * This app (TanStack Start) has no Express layer of its own — no
 * middleware, no HTTP routes — so there is nothing here to "reuse" for
 * endpoint-level metrics. The actual instrumentation lives in the separate
 * feat/gmail-ai-intelligence Express backend (apiMetrics middleware +
 * GET /api/metrics), which is the app that actually serves HTTP endpoints.
 *
 * This module just admin-gates a cross-service fetch to that backend and
 * reshapes the response. It does not duplicate the metrics collection
 * logic, and does not fabricate data if the Express server is unreachable
 * — it reports that clearly instead.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./authorize.server";

export type ApiEndpointMetric = {
  endpoint: string;
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatencyMs: number;
};

export type ApiMetricsResult =
  | { available: true; metrics: ApiEndpointMetric[]; sourceUrl: string }
  | { available: false; error: string; sourceUrl: string };

export const getApiMetricsFromBackend = createServerFn({ method: "GET" }).handler(
  async (): Promise<ApiMetricsResult> => {
    await requireAdmin();

    const baseUrl = process.env.EXPRESS_API_URL || "http://localhost:5000";
    const sourceUrl = `${baseUrl}/api/metrics`;

    try {
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        return {
          available: false,
          error: `Express backend responded with HTTP ${response.status}.`,
          sourceUrl,
        };
      }
      const json = (await response.json()) as { success: boolean; metrics?: ApiEndpointMetric[] };
      return { available: true, metrics: json.metrics ?? [], sourceUrl };
    } catch (err) {
      return {
        available: false,
        error:
          err instanceof Error
            ? `Could not reach the Express backend: ${err.message}`
            : "Could not reach the Express backend.",
        sourceUrl,
      };
    }
  },
);
