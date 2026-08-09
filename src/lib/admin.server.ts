/**
 * admin.server.ts — SERVER-ONLY admin module (Phase 1 foundation).
 *
 * Import these ONLY from createServerFn handlers or other server-only modules,
 * consistent with authorize.server.ts and auth.server.ts.
 *
 * This file currently exposes only the admin access check. Business-logic
 * server functions for System Metrics, AI Usage, API Metrics, Export Usage,
 * Audit Logs, Feature Flags and the Users module are added in later phases.
 */
import { requireAdmin } from "./authorize.server";

// ---------------------------------------------------------------------------
// Shared Type — Safe for Client Consumption
// ---------------------------------------------------------------------------

export type AdminUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "admin";
};

/**
 * Verifies the current session belongs to an admin user and returns a
 * serialized, client-safe admin profile.
 *
 * Throws (via requireAdmin/requireSession):
 *  - AppError(401) if there is no valid session
 *  - AppError(403) if the session belongs to a non-admin user
 *
 * Usage:
 *   const admin = await verifyAdminAccess();
 */
export async function verifyAdminAccess(): Promise<AdminUser> {
  const user = await requireAdmin();
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role ?? "user",
  };
}
