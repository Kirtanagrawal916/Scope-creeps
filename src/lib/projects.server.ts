/**
 * projects.server.ts — Ownership-aware CRUD server functions for Projects.
 *
 * SECURITY CONTRACT: Every query that reads, writes, or deletes a Project
 * MUST include `{ owner: user._id }` in the filter. This is the single
 * enforcement point preventing IDOR across all project operations.
 *
 * The SerializedProject type is safe to import from client route files.
 */
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { Project } from "../models/Project";
import { requireSession } from "./authorize.server";
import { AppError } from "./app-error";
import { formatRelativeDate } from "./utils";
import type { ProjectStatus, RiskLevel } from "../models/Project";

// ---------------------------------------------------------------------------
// Serialized type — safe for client consumption
// ---------------------------------------------------------------------------

export type SerializedProject = {
  id: string;
  owner: string;
  name: string;
  client: string;
  clientInitials: string;
  budget: number;
  hourlyRate: number;
  hoursAllocated: number;
  hoursUsed: number;
  progress: number;
  status: ProjectStatus;
  risk: RiskLevel;
  contract: string;
  scopeItems: string[];
  outOfScope: string[];
  /** Human-readable relative date, e.g. "2h ago" */
  updatedAt: string;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedProject {
  return {
    id: String(doc._id),
    owner: String(doc.owner),
    name: doc.name,
    client: doc.client,
    clientInitials: doc.clientInitials,
    budget: doc.budget ?? 0,
    hourlyRate: doc.hourlyRate ?? 0,
    hoursAllocated: doc.hoursAllocated ?? 0,
    hoursUsed: doc.hoursUsed ?? 0,
    progress: doc.progress ?? 0,
    status: doc.status,
    risk: doc.risk,
    contract: doc.contract ?? "",
    scopeItems: doc.scopeItems ?? [],
    outOfScope: doc.outOfScope ?? [],
    updatedAt: formatRelativeDate(doc.updatedAt),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

/** Derives two-letter initials from a client name. */
function toInitials(clientName: string): string {
  const words = clientName.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : clientName.slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns all projects owned by the current session user,
 * sorted by most-recently updated first.
 */
export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();
  // ✅ Owner filter — only returns the calling user's projects
  let projects = await Project.find({ owner: user._id }).sort({ updatedAt: -1 }).lean();

  // If the user is new and has no projects, auto-seed sample data scoped to them
  if (projects.length === 0) {
    const { seedUserData } = await import("./seed.server");
    await seedUserData(user._id);
    projects = await Project.find({ owner: user._id }).sort({ updatedAt: -1 }).lean();
  }

  return projects.map(serialize);
});

/**
 * Returns a single project.
 * Throws 404 if the project does not exist OR does not belong to the session user.
 * (404 rather than 403 avoids leaking existence to other users.)
 */
export const getProject = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Ownership-aware query — IDOR prevented
    const project = await Project.findOne({ _id: data.id, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");
    return serialize(project);
  });

/**
 * Creates a new project. The owner field is always set from the session —
 * it is never accepted as client input.
 */
export const createProject = createServerFn({ method: "POST" })
  .validator(
    (data: {
      name: string;
      client: string;
      budget: number;
      hourlyRate: number;
      hoursAllocated?: number;
      contract?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireSession();

    if (!data.name?.trim()) throw new AppError(400, "Project name is required.");
    if (!data.client?.trim()) throw new AppError(400, "Client name is required.");

    await connectToDatabase();

    const project = new Project({
      // ✅ Owner always comes from session, never from client input
      owner: user._id,
      name: data.name.trim(),
      client: data.client.trim(),
      clientInitials: toInitials(data.client),
      budget: data.budget ?? 0,
      hourlyRate: data.hourlyRate ?? 0,
      hoursAllocated: data.hoursAllocated ?? 0,
      hoursUsed: 0,
      progress: 0,
      status: "on_track",
      risk: "low",
      contract: data.contract?.trim() ?? "",
      scopeItems: [],
      outOfScope: [],
    });

    await project.save();
    return serialize(project.toObject());
  });

/**
 * Updates project fields. Only the owner may update their own projects.
 * Partial updates — only fields provided will be changed.
 */
export const updateProject = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      name?: string;
      client?: string;
      budget?: number;
      hourlyRate?: number;
      hoursAllocated?: number;
      hoursUsed?: number;
      progress?: number;
      status?: ProjectStatus;
      risk?: RiskLevel;
      contract?: string;
      scopeItems?: string[];
      outOfScope?: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Ownership-aware — findOne prevents updating another user's project
    const project = await Project.findOne({ _id: data.id, owner: user._id });
    if (!project) throw new AppError(404, "Project not found.");

    if (data.name !== undefined) project.name = data.name.trim();
    if (data.client !== undefined) {
      project.client = data.client.trim();
      project.clientInitials = toInitials(data.client);
    }
    if (data.budget !== undefined) project.budget = data.budget;
    if (data.hourlyRate !== undefined) project.hourlyRate = data.hourlyRate;
    if (data.hoursAllocated !== undefined) project.hoursAllocated = data.hoursAllocated;
    if (data.hoursUsed !== undefined) project.hoursUsed = data.hoursUsed;
    if (data.progress !== undefined) project.progress = data.progress;
    if (data.status !== undefined) project.status = data.status;
    if (data.risk !== undefined) project.risk = data.risk;
    if (data.contract !== undefined) project.contract = data.contract.trim();
    if (data.scopeItems !== undefined) project.scopeItems = data.scopeItems;
    if (data.outOfScope !== undefined) project.outOfScope = data.outOfScope;

    await project.save();
    return serialize(project.toObject());
  });

/**
 * Permanently deletes a project. Only the owner may delete.
 * Returns 404 for both "not found" and "wrong owner" to avoid leaking existence.
 */
export const deleteProject = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ findOneAndDelete with owner filter — atomic ownership check + delete
    const deleted = await Project.findOneAndDelete({ _id: data.id, owner: user._id });
    if (!deleted) throw new AppError(404, "Project not found.");
    return { success: true };
  });
