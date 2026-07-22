/**
 * analyses.server.ts — Ownership-aware CRUD for Analysis documents.
 *
 * SECURITY CONTRACT: Every analysis query MUST include `{ owner: user._id }`.
 * Before creating an analysis, BOTH the parent project AND parent email are
 * verified to belong to the session user — preventing ownership-chain attacks.
 */
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { Analysis } from "../models/Analysis";
import { Project } from "../models/Project";
import { EmailThread } from "../models/EmailThread";
import { requireSession } from "./authorize.server";
import { AppError } from "./app-error";
import { formatRelativeDate } from "./utils";
import type { AnalysisVerdict } from "../models/Analysis";
import type { ProjectStatus, RiskLevel } from "../models/Project";

// ---------------------------------------------------------------------------
// Serialized types — safe for client consumption
// ---------------------------------------------------------------------------

export type SerializedAnalysis = {
  id: string;
  owner: string;
  projectId: string;
  emailId: string;
  verdict: AnalysisVerdict;
  confidence: number;
  additionalHours: number;
  timelineImpactDays: number;
  suggestedCost: number;
  includedFeatures: string[];
  outOfScopeFeatures: string[];
  reasoning: string;
  suggestedReply: string;
  /** Human-readable relative date, e.g. "2h ago" */
  createdAt: string;
  /** ISO timestamp, for real date math (charts, sorting) on the client */
  createdAtIso: string;
};

export type SerializedAnalysisDetails = {
  analysis: SerializedAnalysis;
  project: {
    id: string;
    name: string;
    client: string;
    status: ProjectStatus;
    risk: RiskLevel;
  };
  email: {
    id: string;
    from: string;
    fromInitials: string;
    subject: string;
    body: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedAnalysis {
  return {
    id: String(doc._id),
    owner: String(doc.owner),
    projectId: String(doc.projectId),
    emailId: String(doc.emailId),
    verdict: doc.verdict,
    confidence: doc.confidence,
    additionalHours: doc.additionalHours ?? 0,
    timelineImpactDays: doc.timelineImpactDays ?? 0,
    suggestedCost: doc.suggestedCost ?? 0,
    includedFeatures: doc.includedFeatures ?? [],
    outOfScopeFeatures: doc.outOfScopeFeatures ?? [],
    reasoning: doc.reasoning ?? "",
    suggestedReply: doc.suggestedReply ?? "",
    createdAt: formatRelativeDate(doc.createdAt),
    createdAtIso: new Date(doc.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns all analyses for a project.
 * Verifies project ownership before returning child analyses.
 */
export const listAnalysesForProject = createServerFn({ method: "GET" })
  .validator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Verify project ownership first
    const project = await Project.findOne({ _id: data.projectId, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");

    const analyses = await Analysis.find({
      projectId: data.projectId,
      owner: user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return analyses.map(serialize);
  });

/**
 * Returns all analyses across all of the session user's projects.
 */
export const listAllUserAnalyses = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();
  const analyses = await Analysis.find({ owner: user._id }).sort({ createdAt: -1 }).lean();
  return analyses.map(serialize);
});

/**
 * Returns a single analysis.
 * Throws 404 if it doesn't exist or doesn't belong to the session user.
 */
export const getAnalysis = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();
    // ✅ Ownership-aware — IDOR prevented
    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new AppError(404, "Analysis not found.");
    return serialize(analysis);
  });

/**
 * Returns the analysis along with its parent project and email, in a single
 * round-trip. All three documents are verified to belong to the session user.
 */
export const getAnalysisDetails = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    // ✅ Fetch analysis scoped to owner
    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new AppError(404, "Analysis not found.");

    // ✅ Fetch parent project and email — also scoped to owner
    const [project, email] = await Promise.all([
      Project.findOne({ _id: analysis.projectId, owner: user._id })
        .select("name client status risk")
        .lean(),
      EmailThread.findOne({ _id: analysis.emailId, owner: user._id })
        .select("from fromInitials subject body")
        .lean(),
    ]);

    if (!project || !email) throw new AppError(404, "Analysis data not found.");

    return {
      analysis: serialize(analysis),
      project: {
        id: String(project._id),
        name: project.name,
        client: project.client,
        status: project.status,
        risk: project.risk,
      },
      email: {
        id: String(email._id),
        from: email.from,
        fromInitials: email.fromInitials,
        subject: email.subject,
        body: email.body,
      },
    } satisfies SerializedAnalysisDetails;
  });

/**
 * Creates an analysis result for an email thread.
 *
 * SECURITY: Three ownership checks run before creation:
 *   1. The project must belong to the session user.
 *   2. The email must belong to the session user AND to the given project.
 *   3. No duplicate analysis may exist for the same email.
 */
export const createAnalysis = createServerFn({ method: "POST" })
  .validator(
    (data: {
      projectId: string;
      emailId: string;
      verdict: AnalysisVerdict;
      confidence: number;
      additionalHours?: number;
      timelineImpactDays?: number;
      suggestedCost?: number;
      includedFeatures?: string[];
      outOfScopeFeatures?: string[];
      reasoning?: string;
      suggestedReply?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    // ✅ Check 1: project ownership
    const project = await Project.findOne({ _id: data.projectId, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");

    // ✅ Check 2: email ownership + correct project association
    const email = await EmailThread.findOne({
      _id: data.emailId,
      owner: user._id,
      projectId: data.projectId,
    }).lean();
    if (!email) throw new AppError(404, "Email not found in this project.");

    // ✅ Check 3: prevent duplicate analysis
    const existing = await Analysis.findOne({ emailId: data.emailId, owner: user._id }).lean();
    if (existing) throw new AppError(400, "An analysis already exists for this email thread.");

    const analysis = new Analysis({
      owner: user._id,
      projectId: data.projectId,
      emailId: data.emailId,
      verdict: data.verdict,
      confidence: data.confidence,
      additionalHours: data.additionalHours ?? 0,
      timelineImpactDays: data.timelineImpactDays ?? 0,
      suggestedCost: data.suggestedCost ?? 0,
      includedFeatures: data.includedFeatures ?? [],
      outOfScopeFeatures: data.outOfScopeFeatures ?? [],
      reasoning: data.reasoning ?? "",
      suggestedReply: data.suggestedReply ?? "",
    });

    await analysis.save();

    // Mark the email as analyzed (denormalized for fast inbox queries)
    await EmailThread.findOneAndUpdate({ _id: data.emailId, owner: user._id }, { analyzed: true });

    return serialize(analysis.toObject());
  });
