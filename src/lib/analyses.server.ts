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
import { z } from "zod";
import type { AnalysisVerdict } from "../models/Analysis";
import type { ProjectStatus, RiskLevel } from "../models/Project";

// ---------------------------------------------------------------------------
// Serialized types — safe for client consumption
// ---------------------------------------------------------------------------

export type SerializedAnalysis = {
  id: string;
  owner: string;
  projectId: string;
  emailId?: string;
  originalRequirement: string;
  changedRequirement: string;
  aiExplanation: string;
  verdict: AnalysisVerdict;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
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
  email?: {
    id: string;
    from: string;
    fromInitials: string;
    subject: string;
    body: string;
  } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedAnalysis {
  return {
    id: String(doc._id),
    owner: String(doc.owner),
    projectId: String(doc.projectId),
    emailId: doc.emailId ? String(doc.emailId) : undefined,
    originalRequirement: doc.originalRequirement ?? "",
    changedRequirement: doc.changedRequirement ?? "",
    aiExplanation: doc.aiExplanation ?? doc.reasoning ?? "",
    verdict: doc.verdict,
    confidence: doc.confidence,
    riskLevel: doc.riskLevel ?? "low",
    additionalHours: doc.additionalHours ?? 0,
    timelineImpactDays: doc.timelineImpactDays ?? 0,
    suggestedCost: doc.suggestedCost ?? 0,
    includedFeatures: doc.includedFeatures ?? [],
    outOfScopeFeatures: doc.outOfScopeFeatures ?? [],
    reasoning: doc.reasoning ?? "",
    suggestedReply: doc.suggestedReply ?? "",
    createdAt: formatRelativeDate(doc.createdAt),
    createdAtIso: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Scope Analysis Engine Helper
// ---------------------------------------------------------------------------

function performAnalysis(
  project: { hourlyRate: number; budget: number; scopeItems: string[]; outOfScope: string[] },
  text: string,
  subject: string,
) {
  const content = (subject + " " + text).toLowerCase();

  let verdict: "in_scope" | "out_of_scope" | "mixed" = "in_scope";
  let additionalHours = 0;
  const outOfScopeFeatures: string[] = [];
  const includedFeatures: string[] = [];

  // Check against project's explicit out-of-scope items
  for (const item of project.outOfScope || []) {
    if (content.includes(item.toLowerCase())) {
      outOfScopeFeatures.push(item);
      verdict = "out_of_scope";
    }
  }

  // Check general creep keywords if not already out of scope
  const creepKeywords = [
    { kw: "ios", label: "Native iOS Application", hours: 120 },
    { kw: "android", label: "Native Android Application", hours: 120 },
    { kw: "app", label: "Mobile Application build", hours: 100 },
    { kw: "netsuite", label: "NetSuite ERP Integration", hours: 48 },
    { kw: "sap", label: "SAP Integration", hours: 48 },
    { kw: "integration", label: "Third-party Integration", hours: 40 },
    { kw: "dashboard", label: "Analytics Dashboard", hours: 30 },
    { kw: "report", label: "SLA Reporting", hours: 15 },
    { kw: "voice", label: "Voice input dictation", hours: 24 },
    { kw: "redesign", label: "Full UI Redesign", hours: 60 },
  ];

  for (const item of creepKeywords) {
    if (content.includes(item.kw)) {
      if (!outOfScopeFeatures.includes(item.label)) {
        outOfScopeFeatures.push(item.label);
      }
      additionalHours += item.hours;
      verdict = verdict === "in_scope" ? "mixed" : "out_of_scope";
    }
  }

  // Check in-scope items
  for (const item of project.scopeItems || []) {
    if (content.includes(item.toLowerCase())) {
      includedFeatures.push(item);
    }
  }

  // Set default hours if verdict is out of scope / mixed but no hours calculated
  if (verdict === "out_of_scope" && additionalHours === 0) {
    additionalHours = 20;
  } else if (verdict === "mixed" && additionalHours === 0) {
    additionalHours = 10;
  } else if (verdict === "in_scope") {
    additionalHours = 0;
  }

  const hourlyRate = project.hourlyRate || 150;
  const suggestedCost = additionalHours * hourlyRate;
  const timelineImpactDays = Math.ceil(additionalHours / 6);
  const confidence = verdict === "in_scope" ? 98 : Math.floor(Math.random() * 9) + 90; // 90-98%
  const riskLevel: "low" | "medium" | "high" =
    additionalHours > 50 ? "high" : additionalHours > 15 ? "medium" : "low";

  let reasoning = "";
  if (verdict === "in_scope") {
    reasoning = `The requested item matches the contracted deliverables. It fits within the original project scope (e.g. ${project.scopeItems.slice(0, 2).join(", ") || "defined items"}). No budget or timeline adjustments are needed.`;
  } else if (verdict === "out_of_scope") {
    reasoning = `The request introduces deliverables that are explicitly excluded from the current Statement of Work. Specifically, the additions of ${outOfScopeFeatures.join(", ")} are outside of scope. Doing this by the target launch date will require an additional ${additionalHours}h of effort, increasing the budget by $${suggestedCost.toLocaleString()} and extending the timeline by ${timelineImpactDays} days.`;
  } else {
    reasoning = `The request is mixed. While some aspects (like ${includedFeatures.join(", ") || "basic adjustments"}) fall within the original scope, other parts (such as ${outOfScopeFeatures.join(", ")}) represent new requirements. Incorporating these out-of-scope items will require ${additionalHours}h of extra effort, costing $${suggestedCost.toLocaleString()} and adding ${timelineImpactDays} days to the schedule.`;
  }

  const clientName = project.client.split(" ")[0] || "Client";
  let suggestedReply = "";
  if (verdict === "in_scope") {
    suggestedReply = `Hi ${clientName},\n\nThanks for reaching out! Happy to confirm that this falls within our agreed scope of work. We'll proceed with this and keep you updated on progress.\n\nBest,\nAlex`;
  } else {
    suggestedReply =
      `Hi ${clientName},\n\nThanks — glad the progress is landing well.\n\nRegarding the additions of ${outOfScopeFeatures.join(" and ")}: these fall outside our current statement of work. I'm happy to take them on, but I want to be upfront about the project impact so there are no surprises:\n\n` +
      `• Combined effort: +${additionalHours} hours\n` +
      `• Budget impact: +$${suggestedCost.toLocaleString()}\n` +
      `• Timeline: adds approximately ${timelineImpactDays} days\n\n` +
      `If you'd like, I can draft a short change order covering these, or we can phase them for a post-launch v1.1. Let me know what you prefer!\n\nBest,\nAlex`;
  }

  return {
    verdict,
    confidence,
    riskLevel,
    additionalHours,
    timelineImpactDays,
    suggestedCost,
    includedFeatures,
    outOfScopeFeatures,
    reasoning,
    suggestedReply,
  };
}

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// ---------------------------------------------------------------------------

const listAnalysesSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

const getAnalysisSchema = z.object({
  id: z.string().min(1, "Analysis ID is required"),
});

const createAnalysisSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  emailId: z.string().min(1, "Email ID is required"),
  verdict: z.enum(["in_scope", "out_of_scope", "mixed"]),
  confidence: z.number().min(0).max(100),
  additionalHours: z.number().min(0).optional(),
  timelineImpactDays: z.number().min(0).optional(),
  suggestedCost: z.number().min(0).optional(),
  includedFeatures: z.array(z.string()).optional(),
  outOfScopeFeatures: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
  suggestedReply: z.string().optional(),
});

const runScopeAnalysisSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  originalRequirement: z.string().min(1, "Original requirement is required"),
  changedRequirement: z.string().min(1, "Changed requirement is required"),
});

const analyzeEmailSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Returns all analyses for a project.
 * Verifies project ownership before returning child analyses.
 */
export const listAnalysesForProject = createServerFn({ method: "GET" })
  .validator((data: unknown) => listAnalysesSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

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
 */
export const getAnalysis = createServerFn({ method: "GET" })
  .validator((data: unknown) => getAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new AppError(404, "Analysis not found.");
    return serialize(analysis);
  });

/**
 * Returns the analysis along with its parent project and email, in a single round-trip.
 */
export const getAnalysisDetails = createServerFn({ method: "GET" })
  .validator((data: unknown) => getAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new AppError(404, "Analysis not found.");

    const [project, email] = await Promise.all([
      Project.findOne({ _id: analysis.projectId, owner: user._id })
        .select("name client status risk")
        .lean(),
      analysis.emailId
        ? EmailThread.findOne({ _id: analysis.emailId, owner: user._id })
            .select("from fromInitials subject body")
            .lean()
        : Promise.resolve(null),
    ]);

    if (!project) throw new AppError(404, "Parent project not found.");

    return {
      analysis: serialize(analysis),
      project: {
        id: String(project._id),
        name: project.name,
        client: project.client,
        status: project.status,
        risk: project.risk,
      },
      email: email
        ? {
            id: String(email._id),
            from: email.from,
            fromInitials: email.fromInitials,
            subject: email.subject,
            body: email.body,
          }
        : null,
    } satisfies SerializedAnalysisDetails;
  });

/**
 * Creates an analysis result for an email thread.
 */
export const createAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => createAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOne({ _id: data.projectId, owner: user._id }).lean();
    if (!project) throw new AppError(404, "Project not found.");

    const email = await EmailThread.findOne({
      _id: data.emailId,
      owner: user._id,
      projectId: data.projectId,
    }).lean();
    if (!email) throw new AppError(404, "Email not found in this project.");

    const existing = await Analysis.findOne({ emailId: data.emailId, owner: user._id }).lean();
    if (existing) throw new AppError(400, "An analysis already exists for this email thread.");

    const reasoning = data.reasoning ?? "";
    const riskLevel =
      data.additionalHours && data.additionalHours > 50
        ? "high"
        : data.additionalHours && data.additionalHours > 15
          ? "medium"
          : "low";

    const analysis = new Analysis({
      owner: user._id,
      projectId: data.projectId,
      emailId: data.emailId,
      originalRequirement: project.contract || project.scopeItems.join(", "),
      changedRequirement: email.body,
      aiExplanation: reasoning,
      verdict: data.verdict,
      confidence: data.confidence,
      riskLevel: riskLevel,
      additionalHours: data.additionalHours ?? 0,
      timelineImpactDays: data.timelineImpactDays ?? 0,
      suggestedCost: data.suggestedCost ?? 0,
      includedFeatures: data.includedFeatures ?? [],
      outOfScopeFeatures: data.outOfScopeFeatures ?? [],
      reasoning: reasoning,
      suggestedReply: data.suggestedReply ?? "",
    });

    await analysis.save();

    await EmailThread.findOneAndUpdate(
      { _id: data.emailId, owner: user._id },
      { analyzed: true, risk: riskLevel },
    );

    return serialize(analysis.toObject());
  });

/**
 * Runs scope analysis on manual requirements.
 */
export const runScopeAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => runScopeAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOne({ _id: data.projectId, owner: user._id });
    if (!project) throw new AppError(404, "Project not found.");

    const analysisResult = performAnalysis(
      project,
      data.changedRequirement,
      "Manual requirement analysis",
    );

    const analysis = new Analysis({
      owner: user._id,
      projectId: project._id,
      originalRequirement: data.originalRequirement,
      changedRequirement: data.changedRequirement,
      aiExplanation: analysisResult.reasoning,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      riskLevel: analysisResult.riskLevel,
      additionalHours: analysisResult.additionalHours,
      timelineImpactDays: analysisResult.timelineImpactDays,
      suggestedCost: analysisResult.suggestedCost,
      includedFeatures: analysisResult.includedFeatures,
      outOfScopeFeatures: analysisResult.outOfScopeFeatures,
      reasoning: analysisResult.reasoning,
      suggestedReply: analysisResult.suggestedReply,
    });

    await analysis.save();
    return serialize(analysis.toObject());
  });

/**
 * Analyzes an unanalyzed email thread using the automated Scope Analysis Engine.
 */
export const analyzeEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => analyzeEmailSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const email = await EmailThread.findOne({ _id: data.emailId, owner: user._id });
    if (!email) throw new AppError(404, "Email thread not found.");

    const project = await Project.findOne({ _id: email.projectId, owner: user._id });
    if (!project) throw new AppError(404, "Project not found.");

    const existing = await Analysis.findOne({ emailId: email._id, owner: user._id }).lean();
    if (existing) return serialize(existing);

    const analysisResult = performAnalysis(project, email.body, email.subject);

    const analysis = new Analysis({
      owner: user._id,
      projectId: project._id,
      emailId: email._id,
      originalRequirement: project.contract || project.scopeItems.join(", "),
      changedRequirement: email.body,
      aiExplanation: analysisResult.reasoning,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      riskLevel: analysisResult.riskLevel,
      additionalHours: analysisResult.additionalHours,
      timelineImpactDays: analysisResult.timelineImpactDays,
      suggestedCost: analysisResult.suggestedCost,
      includedFeatures: analysisResult.includedFeatures,
      outOfScopeFeatures: analysisResult.outOfScopeFeatures,
      reasoning: analysisResult.reasoning,
      suggestedReply: analysisResult.suggestedReply,
    });

    await analysis.save();

    email.analyzed = true;
    email.risk = analysisResult.riskLevel;
    await email.save();

    return serialize(analysis.toObject());
  });
