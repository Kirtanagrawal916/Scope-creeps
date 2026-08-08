import { env } from "../config/env.js";

// Catches requests to routes that don't exist. Must be registered after all routes.
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Catches errors passed via next(err) from anywhere in the app.
// Must be registered last, after every other middleware/route.
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Stack traces only leak in development.
    ...(env.isDev && { stack: err.stack }),
  });
}
