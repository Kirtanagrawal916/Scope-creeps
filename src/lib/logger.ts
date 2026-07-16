/**
 * logger.ts
 *
 * Environment-aware logging utility.
 * - Restricts debug logs (log, warn) to development environment.
 * - Keeps error logs enabled in production but automatically sanitizes sensitive information
 *   (such as passwords, tokens, secrets, cookies).
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Replaces sensitive values in string logs with mask patterns.
 */
function sanitize(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/(password|passwd|pass)\s*[:=]\s*["']?[^\s"'\s&,]+["']?/gi, "$1=*****")
    .replace(/(token|session_token|jwt|jwt_secret)\s*[:=]\s*["']?[^\s"'\s&,]+["']?/gi, "$1=*****")
    .replace(/(secret|client_secret|clientsecret)\s*[:=]\s*["']?[^\s"'\s&,]+["']?/gi, "$1=*****")
    .replace(/(cookie|set-cookie)\s*[:=]\s*["']?[^\s"'\s&,]+["']?/gi, "$1=*****");
}

export const logger = {
  log(message: string, ...args: unknown[]) {
    if (!isProduction) {
      const cleanMessage = String(sanitize(message));
      const cleanArgs = args.map(sanitize);
      console.log(`[DEV] ${cleanMessage}`, ...cleanArgs);
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (!isProduction) {
      const cleanMessage = String(sanitize(message));
      const cleanArgs = args.map(sanitize);
      console.warn(`[WARN] ${cleanMessage}`, ...cleanArgs);
    }
  },

  error(message: string, ...args: unknown[]) {
    // Keep error logging in production but sanitize first to prevent leakage in log collectors
    const cleanMessage = String(sanitize(message));
    const cleanArgs = args.map(sanitize);
    console.error(`[ERROR] ${cleanMessage}`, ...cleanArgs);
  },
};
