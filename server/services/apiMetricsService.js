/**
 * apiMetricsService.js — In-memory, per-endpoint request metrics.
 *
 * TEMPORARY in-memory store, same pattern as analyticsService.js's counters.
 * Resets on every server restart. Populated by middleware/apiMetrics.js on
 * every request that passes through the server — nothing here is estimated
 * or fabricated, only what Express itself observes (method, matched route,
 * status code, elapsed time).
 *
 * No Prometheus, no Grafana, no external metrics backend — just a Map,
 * which is realistic for this project's current scale and matches the
 * existing analyticsService.js approach.
 */

// endpoint (e.g. "GET /api/gmail/emails") -> { count, successCount, errorCount, totalLatencyMs }
const endpointStats = new Map();

export function recordApiRequest(endpoint, statusCode, durationMs) {
  const existing = endpointStats.get(endpoint) ?? {
    count: 0,
    successCount: 0,
    errorCount: 0,
    totalLatencyMs: 0,
  };

  existing.count += 1;
  existing.totalLatencyMs += durationMs;

  // 2xx/3xx counted as success, everything else (4xx/5xx) as error — the
  // same status-code convention already used by errorHandler.js.
  if (statusCode >= 200 && statusCode < 400) {
    existing.successCount += 1;
  } else {
    existing.errorCount += 1;
  }

  endpointStats.set(endpoint, existing);
}

/**
 * Returns per-endpoint metrics, busiest endpoint first.
 */
export function getApiMetrics() {
  return Array.from(endpointStats.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      requestCount: stats.count,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      averageLatencyMs: stats.count > 0 ? Math.round(stats.totalLatencyMs / stats.count) : 0,
    }))
    .sort((a, b) => b.requestCount - a.requestCount);
}
