/**
 * authorize.server.ts — Server-only authorization helpers.
 *
 * Import these ONLY from createServerFn handlers or other server-only modules.
 * Never import directly from client-visible route or component files.
 */
import { getSessionUser } from "./auth.server";
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
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "You must be logged in to perform this action.");
  }
  return user;
}
