import { getApiMetrics as getApiMetricsService } from "../services/apiMetricsService.js";

/**
 * Returns per-endpoint request metrics collected by apiMetrics middleware.
 * GET /api/metrics
 *
 * NOTE: unlike the rest of this backend's routes, this one exposes
 * operational data about the server itself. No auth middleware exists
 * anywhere in this backend yet (checked every route file), so this
 * endpoint currently has the same (no) protection as everything else here
 * — it is not more or less exposed than /api/analytics/overview. If this
 * server is ever deployed somewhere reachable outside the admin dashboard,
 * add auth here first.
 */
export function getApiMetrics(req, res) {
  const metrics = getApiMetricsService();
  res.json({ success: true, metrics });
}
