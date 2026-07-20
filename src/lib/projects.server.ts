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

import { z } from "zod";

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
  archived: boolean;
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
    archived: doc.archived ?? false,
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
// Zod Validation Schemas
// ---------------------------------------------------------------------------

const listProjectsSchema = z
  .object({
    archived: z.boolean().optional(),
  })
  .optional();

const getProjectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  client: z.string().min(1, "Client name is required"),
  budget: z.number().min(0, "Budget must be a positive number"),
  hourlyRate: z.number().min(0, "Hourly rate must be a positive number"),
  hoursAllocated: z.number().min(0, "Hours allocated must be a positive number").optional(),
  contract: z.string().optional(),
});

const updateProjectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1).optional(),
  client: z.string().min(1).optional(),
  budget: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  hoursAllocated: z.number().min(0).optional(),
  hoursUsed: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["on_track", "at_risk", "scope_creep", "completed"]).optional(),
  risk: z.enum(["low", "medium", "high"]).optional(),
  contract: z.string().optional(),
  scopeItems: z.array(z.string()).optional(),
  outOfScope: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
});

const deleteProjectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns all projects owned by the current session user,
 * sorted by most-recently updated first.
 * Filter by archived status if specified (defaults to false).
 */
export const listProjects = createServerFn({ method: "GET" })
  .validator((data: unknown) => listProjectsSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const showArchived = data?.archived ?? false;
    let projects = await Project.find({ owner: user._id, archived: showArchived })
      .sort({ updatedAt: -1 })
      .lean();

    // If the user is new and has no projects, auto-seed sample data scoped to them (only if requesting active)
    if (projects.length === 0 && !showArchived) {
      const { seedUserData } = await import("./seed.server");
      await seedUserData(user._id);
      projects = await Project.find({ owner: user._id, archived: false })
        .sort({ updatedAt: -1 })
        .lean();
    }

    return projects.map(serialize);
  });

/**
 * Returns a single project.
 * Throws 404 if the project does not exist OR does not belong to the session user.
 */
export const getProject = createServerFn({ method: "GET" })
  .validator((data: unknown) => getProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOne({ _id: data.id, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");
    return serialize(project);
  });

/**
 * Creates a new project. The owner field is always set from the session.
 */
export const createProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => createProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();

    await connectToDatabase();

    const project = new Project({
      owner: user._id,
      name: data.name.trim(),
      client: data.client.trim(),
      clientInitials: toInitials(data.client),
      budget: data.budget,
      hourlyRate: data.hourlyRate,
      hoursAllocated: data.hoursAllocated ?? 0,
      hoursUsed: 0,
      progress: 0,
      status: "on_track",
      risk: "low",
      contract: data.contract?.trim() ?? "",
      scopeItems: [],
      outOfScope: [],
      archived: false,
    });

    await project.save();
    return serialize(project.toObject());
  });

/**
 * Updates project fields. Only the owner may update their own projects.
 */
export const updateProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

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
    if (data.archived !== undefined) project.archived = data.archived;

    await project.save();
    return serialize(project.toObject());
  });

/**
 * Archives a project.
 */
export const archiveProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOneAndUpdate(
      { _id: data.id, owner: user._id },
      { archived: true },
      { new: true },
    );
    if (!project) throw new AppError(404, "Project not found.");
    return serialize(project.toObject());
  });

/**
 * Restores an archived project.
 */
export const restoreProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOneAndUpdate(
      { _id: data.id, owner: user._id },
      { archived: false },
      { new: true },
    );
    if (!project) throw new AppError(404, "Project not found.");
    return serialize(project.toObject());
  });

/**
 * Permanently deletes a project. Only the owner may delete.
 */
export const deleteProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const deleted = await Project.findOneAndDelete({ _id: data.id, owner: user._id });
    if (!deleted) throw new AppError(404, "Project not found.");
    return { success: true };
  });
