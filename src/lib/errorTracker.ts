// Priority 4: Centralized Error Tracking Engine (Sentry-like diagnostics)

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  path: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
  count: number;
  environment: string;
  handled: boolean;
  metadata?: Record<string, any>;
}

class ErrorTrackerEngine {
  private errors: Map<string, TrackedError> = new Map();

  constructor() {
    this.seedMockErrors();
  }

  private seedMockErrors() {
    const mocks: TrackedError[] = [
      {
        id: "err-401",
        message: "Gmail OAuth Refresh Token expired for user account",
        stack: "Error: Token Expired at GoogleOAuthProvider.refresh (gmail.server.ts:142)",
        path: "/api/gmail/sync",
        severity: "HIGH",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        count: 4,
        environment: process.env.NODE_ENV || "development",
        handled: true,
      },
      {
        id: "err-402",
        message: "Gemini API Rate Limit hit during batch scope extraction",
        stack: "GoogleGenAIError: 429 Too Many Requests at generateContent (ai.ts:89)",
        path: "/api/ai/compare",
        severity: "MEDIUM",
        timestamp: new Date(Date.now() - 4500000).toISOString(),
        count: 12,
        environment: process.env.NODE_ENV || "development",
        handled: true,
      },
    ];

    mocks.forEach((e) => this.errors.set(e.id, e));
  }

  captureError(
    err: Error | string,
    options?: {
      path?: string;
      severity?: TrackedError["severity"];
      metadata?: Record<string, any>;
    },
  ): TrackedError {
    const message = typeof err === "string" ? err : err.message || "Unknown Runtime Error";
    const stack = typeof err === "string" ? undefined : err.stack;
    const path = options?.path || "/api/unknown";
    const severity = options?.severity || "MEDIUM";

    // Deduplicate by message & path
    const key = `${message}:${path}`;
    const existing = Array.from(this.errors.values()).find(
      (e) => `${e.message}:${e.path}` === key,
    );

    if (existing) {
      existing.count += 1;
      existing.timestamp = new Date().toISOString();
      return existing;
    }

    const tracked: TrackedError = {
      id: `err-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      message,
      stack,
      path,
      severity,
      timestamp: new Date().toISOString(),
      count: 1,
      environment: process.env.NODE_ENV || "development",
      handled: true,
      metadata: options?.metadata,
    };

    this.errors.set(tracked.id, tracked);
    console.error(`[ErrorTracker] Captured [${severity}] ${message} at ${path}`);
    return tracked;
  }

  getErrors(): TrackedError[] {
    return Array.from(this.errors.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  clearError(id: string): boolean {
    return this.errors.delete(id);
  }
}

export const errorTracker = new ErrorTrackerEngine();
