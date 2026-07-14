/**
 * emails.server.ts — Ownership-aware CRUD for EmailThread documents.
 *
 * SECURITY CONTRACT: Every email query MUST include `{ owner: user._id }`.
 * For per-project queries, the project's ownership is verified FIRST before
 * returning any emails — this prevents accessing emails via a forged projectId.
 */
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { EmailThread } from "../models/EmailThread";
import { Project } from "../models/Project";
import { requireSession } from "./authorize.server";
import { AppError } from "./app-error";
import { formatRelativeDate } from "./utils";
import type { RiskLevel } from "../models/Project";

// ---------------------------------------------------------------------------
// Serialized type — safe for client consumption
// ---------------------------------------------------------------------------

export type SerializedEmail = {
  id: string;
  owner: string;
  projectId: string;
  /** Display name for the project — populated from the Project collection. */
  projectName: string;
  from: string;
  fromInitials: string;
  subject: string;
  preview: string;
  body: string;
  /** Human-readable relative date, e.g. "5h ago" */
  receivedAt: string;
  analyzed: boolean;
  risk: RiskLevel;
  unread: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any, projectName = ""): SerializedEmail {
  return {
    id: String(doc._id),
    owner: String(doc.owner),
    projectId: String(doc.projectId),
    projectName,
    from: doc.from,
    fromInitials: doc.fromInitials,
    subject: doc.subject,
    preview: doc.preview ?? "",
    body: doc.body ?? "",
    receivedAt: formatRelativeDate(doc.receivedAt ?? doc.createdAt),
    analyzed: doc.analyzed ?? false,
    risk: doc.risk,
    unread: doc.unread ?? false,
  };
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns all email threads for a specific project.
 *
 * SECURITY: The project ownership is verified first. If the project doesn't
 * belong to the session user, a 404 is returned — regardless of whether
 * the project exists — to prevent existence leakage (IDOR prevention).
 */
export const listEmailsForProject = createServerFn({ method: "GET" })
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Verify project ownership before returning any child resources
    const project = await Project.findOne({ _id: data.projectId, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");

    // ✅ Email query also scoped to owner — belt-and-suspenders
    const emails = await EmailThread.find({
      projectId: data.projectId,
      owner: user._id,
    })
      .sort({ receivedAt: -1 })
      .lean();

    return emails.map((e) => serialize(e, project.name));
  });

/**
 * Returns all email threads across all of the session user's projects,
 * with project names populated.
 */
export const listAllUserEmails = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();

  // ✅ Only the session user's emails
  const emails = await EmailThread.find({ owner: user._id }).sort({ receivedAt: -1 }).lean();

  if (emails.length === 0) return [];

  // Build project name map for display — also owner-filtered for safety
  const projectIds = [...new Set(emails.map((e) => String(e.projectId)))];
  const projects = await Project.find({
    _id: { $in: projectIds },
    owner: user._id,
  })
    .select("name")
    .lean();
  const nameMap = new Map(projects.map((p) => [String(p._id), p.name]));

  return emails.map((e) => serialize(e, nameMap.get(String(e.projectId)) ?? ""));
});

/**
 * Creates a new email thread inside a project.
 * Verifies project ownership before creating the child document.
 */
export const createEmailThread = createServerFn({ method: "POST" })
  .validator(
    (data: {
      projectId: string;
      from: string;
      fromInitials: string;
      subject: string;
      preview?: string;
      body?: string;
      risk?: RiskLevel;
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Verify project ownership first
    const project = await Project.findOne({ _id: data.projectId, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");

    const email = new EmailThread({
      // ✅ Owner always comes from session
      owner: user._id,
      projectId: data.projectId,
      from: data.from.trim(),
      fromInitials: data.fromInitials.trim(),
      subject: data.subject.trim(),
      preview: data.preview?.trim() ?? "",
      body: data.body?.trim() ?? "",
      receivedAt: new Date(),
      analyzed: false,
      risk: data.risk ?? "low",
      unread: true,
    });

    await email.save();
    return serialize(email.toObject(), project.name);
  });

/**
 * Marks an email thread as read. Only the owner may update it.
 */
export const markEmailRead = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Owner-scoped update — cannot mark another user's email as read
    const email = await EmailThread.findOne({ _id: data.id, owner: user._id });
    if (!email) throw new AppError(404, "Email not found.");
    email.unread = false;
    await email.save();
    return { success: true };
  });
