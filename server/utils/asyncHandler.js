/**
 * Wraps an async Express route handler so any thrown or rejected error is
 * forwarded to the error-handling middleware via next(err), instead of
 * being silently lost. Every service in this codebase already returns
 * { success: false, ... } rather than throwing, so this only matters for
 * genuinely unexpected failures — it does not change the response for any
 * request that currently succeeds or fails through the normal checks.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
