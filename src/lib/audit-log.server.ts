/**
 * audit-log.server.ts — Audit Logs (Phase 5).
 *
 * logAuditEvent() is a plain, best-effort write helper — call it from any
 * server-only module after an action worth recording. It never throws
 * (a logging failure must not break the action being logged), and never
 * requires its own auth check since callers are already inside an
 * admin-only server function.
 *
 * listAuditLogs() is the only reader, and is itself admin-gated via
 * requireAdmin() — same guard reused everywhere else in the admin module.
 */
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { AuditLog, type AuditAction, type AuditTargetType } from "../models/AuditLog";
import { requireAdmin } from "./authorize.server";
import { logger } from "./logger";

export type SerializedAuditLog = {
  id: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  message: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedAuditLog {
  return {
    id: String(doc._id),
    actorEmail: doc.actorEmail,
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId,
    message: doc.message,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

/**
 * Records an audit event. Swallows its own errors (logs to the console
 * instead) so that a logging failure never blocks the underlying admin
 * action from completing.
 */
export async function logAuditEvent(entry: {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create(entry);
  } catch (err) {
    logger.error("[AUDIT LOG] Failed to record audit event:", err);
  }
}

/**
 * Returns the most recent audit log entries (capped at 500 — this is an
 * operational log view, not a full export/reporting feature).
 * Search/sort/pagination for the table are handled client-side, matching
 * the convention used by the Users module.
 */
export const listAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  await connectToDatabase();

  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(500).lean();
  return logs.map(serialize);
});
