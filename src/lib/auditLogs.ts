// Priority 5: System Audit Logs Engine & Activity Stream

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  ipAddress: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  details: string;
  metadata?: Record<string, unknown>;
}

class AuditLogsEngine {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.seedMockLogs();
  }

  private seedMockLogs() {
    const mocks: AuditLogEntry[] = [
      {
        id: "log-501",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        action: "USER_ROLE_CHANGED",
        actor: "admin@scopeguard.io",
        ipAddress: "192.168.1.45",
        severity: "WARN",
        details: "User 'anand@scopeguard.io' promoted to Admin role.",
        metadata: { userId: "usr-02", newRole: "Admin" },
      },
      {
        id: "log-502",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        action: "GMAIL_OAUTH_CONNECTED",
        actor: "kirtan@scopeguard.io",
        ipAddress: "10.0.0.12",
        severity: "INFO",
        details: "Gmail account successfully authorized for inbox scope scanning.",
        metadata: { scopes: ["https://www.googleapis.com/auth/gmail.readonly"] },
      },
      {
        id: "log-503",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        action: "FEATURE_FLAG_TOGGLED",
        actor: "system_automation",
        ipAddress: "127.0.0.1",
        severity: "INFO",
        details: "Feature flag 'enable_redis_queue' set to enabled.",
        metadata: { flag: "enable_redis_queue" },
      },
      {
        id: "log-504",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: "SECURITY_AUTH_FAILURE",
        actor: "unknown_client",
        ipAddress: "185.220.101.4",
        severity: "CRITICAL",
        details: "Multiple failed login attempts detected from unrecognized IP.",
        metadata: { failedAttempts: 5 },
      },
    ];

    this.logs = mocks;
  }

  recordLog(entry: Omit<AuditLogEntry, "id" | "timestamp" | "ipAddress"> & { ipAddress?: string }) {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      ipAddress: entry.ipAddress || "127.0.0.1",
      action: entry.action,
      actor: entry.actor,
      severity: entry.severity,
      details: entry.details,
      metadata: entry.metadata,
    };

    this.logs.unshift(newLog); // Newest first
    return newLog;
  }

  getLogs(filter?: { severity?: string; search?: string }): AuditLogEntry[] {
    let result = [...this.logs];

    if (filter?.severity && filter.severity !== "ALL") {
      result = result.filter((l) => l.severity === filter.severity);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q),
      );
    }

    return result;
  }
}

export const auditLogs = new AuditLogsEngine();
