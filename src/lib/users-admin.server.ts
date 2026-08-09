/**
 * users-admin.server.ts — Admin-only server functions for the Users module.
 *
 * SECURITY CONTRACT: Every function here MUST call requireAdmin() first.
 * This file reuses the existing User model and the requireAdmin() guard
 * added in authorize.server.ts — it does not duplicate or modify anything
 * in auth.server.ts (login, registration, JWT, Google OAuth are untouched).
 *
 * Deletion is intentionally NOT implemented: no part of this project
 * currently supports deleting a User document, so this module does not
 * introduce it either. Deactivation (isActive) is the supported alternative.
 *
 * The AdminManagedUser type is safe to import from client route files.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectToDatabase } from "./db";
import { User } from "../models/User";
import { requireAdmin } from "./authorize.server";
import { AppError } from "./app-error";

// ---------------------------------------------------------------------------
// Serialized type — safe for client consumption (no password field)
// ---------------------------------------------------------------------------

export type AdminManagedUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  workspaceName?: string;
  role: "user" | "admin";
  isActive: boolean;
  provider?: string;
  createdAt: string;
  updatedAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): AdminManagedUser {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    workspaceName: doc.workspaceName,
    role: doc.role ?? "user",
    isActive: doc.isActive ?? true,
    provider: doc.provider ?? "local",
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// ---------------------------------------------------------------------------

const getUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

const updateUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  workspaceName: z.string().trim().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

const setUserActiveSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  isActive: z.boolean(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns every user in the database, most-recently-created first.
 * Search / sort / pagination are handled client-side, matching the existing
 * convention used by listProjects + app.projects.index.tsx.
 */
export const listAllUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  await connectToDatabase();

  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map(serialize);
});

/** Returns a single user by ID. Throws 404 if not found. */
export const getUser = createServerFn({ method: "GET" })
  .validator((data: unknown) => getUserSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    await connectToDatabase();

    const user = await User.findById(data.id).lean();
    if (!user) throw new AppError(404, "User not found.");
    return serialize(user);
  });

/**
 * Updates the allowed editable fields for a user: firstName, lastName,
 * workspaceName, role. Email and password are intentionally excluded —
 * they belong to the login/authentication flow, which this phase does
 * not modify.
 */
export const updateUser = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateUserSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    await connectToDatabase();

    const user = await User.findById(data.id);
    if (!user) throw new AppError(404, "User not found.");

    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.workspaceName !== undefined) user.workspaceName = data.workspaceName;

    if (data.role !== undefined) {
      if (String(user._id) === String(admin._id) && data.role !== "admin") {
        throw new AppError(400, "You cannot remove your own admin role.");
      }
      user.role = data.role;
    }

    await user.save();
    return serialize(user);
  });

/**
 * Activates or deactivates a user. Deactivated users are blocked from all
 * protected actions via the isActive check in authorize.server.ts's
 * requireSession() — their existing session cookie stops working on the
 * next request rather than being forcibly revoked immediately.
 */
export const setUserActive = createServerFn({ method: "POST" })
  .validator((data: unknown) => setUserActiveSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await requireAdmin();
    await connectToDatabase();

    if (String(data.id) === String(admin._id) && !data.isActive) {
      throw new AppError(400, "You cannot deactivate your own account.");
    }

    const user = await User.findById(data.id);
    if (!user) throw new AppError(404, "User not found.");

    user.isActive = data.isActive;
    await user.save();
    return serialize(user);
  });
