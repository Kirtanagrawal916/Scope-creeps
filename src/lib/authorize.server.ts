/**
 * authorize.server.ts — Server-only authorization helpers.
 *
 * Import these ONLY from createServerFn handlers or other server-only modules.
 * Never import directly from client-visible route or component files.
 */
import { AppError } from "./app-error";
import type { IUser } from "../models/User";

/**
 * Retrieves the authenticated user from the session cookie.
 * Throws a 401 AppError if no valid session exists.
 *
 * Usage:
 *   const user = await requireSession();
 *   // user._id, user.email, etc. are now available
 */
export async function requireSession(): Promise<IUser> {
  const { getSessionUser } = await import("./auth.server");
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "You must be logged in to perform this action.");
  }
  return user;
}

/**
 * Retrieves the authenticated user and verifies they hold the "admin" role.
 * Throws a 401 AppError (via requireSession) if there is no valid session,
 * or a 403 AppError if the session belongs to a non-admin user.
 *
 * Usage:
 *   const admin = await requireAdmin();
 *   // admin is a session-verified user with role === "admin"
 */
export async function requireAdmin(): Promise<IUser> {
  const user = await requireSession();
  if (user.role !== "admin") {
    throw new AppError(403, "You do not have permission to access this area.");
  }
  return user;
}

