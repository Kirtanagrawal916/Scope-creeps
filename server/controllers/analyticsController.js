import { getOverview as getOverviewService } from "../services/analyticsService.js";

/**
 * Returns aggregate analytics counters.
 * GET /api/analytics/overview
 */
export function getOverview(req, res) {
  const result = getOverviewService();
  res.json({ success: true, analytics: result.data });
}
