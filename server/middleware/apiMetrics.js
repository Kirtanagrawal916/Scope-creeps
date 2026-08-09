import { recordApiRequest } from "../services/apiMetricsService.js";

/**
 * apiMetrics.js — Request-timing middleware (Phase 8: API Metrics).
 *
 * Mounted once, globally, in app.js — same style as the existing helmet/
 * cors/morgan middleware. Measures wall-clock time per request and records
 * it against the matched route once the response finishes.
 *
 * req.route is only populated once Express has matched a route handler, so
 * this reads it inside the `res.on("finish", ...)` callback (after routing
 * has happened), not at the top of the middleware. Unmatched requests
 * (404s) fall back to the raw path so they're still counted rather than
 * dropped.
 */
export function apiMetricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const routePath = req.route ? req.baseUrl + req.route.path : req.path;
    const endpoint = `${req.method} ${routePath}`;
    recordApiRequest(endpoint, res.statusCode, durationMs);
  });

  next();
}
