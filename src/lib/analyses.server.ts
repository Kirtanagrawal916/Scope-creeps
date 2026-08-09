/**
 * analyses.server.ts — Ownership-aware CRUD for Analysis documents.
 *
 * SECURITY CONTRACT: Every analysis query MUST include `{ owner: user._id }` or `{ userId: user._id }`.
 * Before creating an analysis, BOTH the parent project AND parent email are
 * verified to belong to the session user — preventing ownership-chain attacks.
 */
import { createServerFn } from "@tanstack/react-start";
import { AppError } from "./app-error";
import { formatRelativeDate } from "./utils";
import { formatCurrency } from "./formatters";
import { z } from "zod";
import type { AnalysisVerdict } from "../models/Analysis";
import type { ProjectStatus, RiskLevel } from "../models/Project";

// ---------------------------------------------------------------------------
// Serialized types — safe for client consumption
// ---------------------------------------------------------------------------

export type SerializedAnalysis = {
  id: string;
  owner: string;
  userId: string;
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

  // Extended fields
  aiSummary: string;
  explanation: string;
  executiveSummary: string;
  technicalExplanation: string;
  potentialRisks: string[];
  recommendations: string[];
  addedRequirements: string[];
  removedRequirements: string[];
  modifiedRequirements: string[];
  missingRequirements: string[];
  detectedFeatures?: string[];
  clientFriendlinessScore: number;
  priority: "low" | "medium" | "high";
  status: "active" | "pending" | "resolved";
  pinned: boolean;
  bookmarked: boolean;
  archived: boolean;
  aiModel?: string;
  promptVersion?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTime?: number;
  isFallback?: boolean;

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
    userId: String(doc.userId || doc.owner),
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

    // Extended fields mappings
    aiSummary: doc.aiSummary ?? "",
    explanation: doc.explanation ?? doc.aiExplanation ?? doc.reasoning ?? "",
    executiveSummary: doc.executiveSummary ?? doc.aiSummary ?? "",
    technicalExplanation: doc.technicalExplanation ?? doc.explanation ?? "",
    potentialRisks: doc.potentialRisks ?? [],
    recommendations: doc.recommendations ?? [],
    addedRequirements: doc.addedRequirements ?? doc.outOfScopeFeatures ?? [],
    removedRequirements: doc.removedRequirements ?? [],
    modifiedRequirements: doc.modifiedRequirements ?? [],
    missingRequirements: doc.missingRequirements ?? [],
    detectedFeatures: doc.detectedFeatures ?? [],
    clientFriendlinessScore: doc.clientFriendlinessScore ?? 85,
    priority: doc.priority ?? "medium",
    status: doc.status ?? "active",
    pinned: doc.pinned ?? false,
    bookmarked: doc.bookmarked ?? false,
    archived: doc.archived ?? false,
    aiModel: doc.aiModel ?? "gemini-2.5-flash",
    promptVersion: doc.promptVersion ?? "v1.0",
    tokensUsed: doc.tokensUsed ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    processingTime: doc.processingTime ?? 0,
    isFallback: doc.isFallback ?? false,

    createdAt: formatRelativeDate(doc.createdAt),
    createdAtIso:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Scope Analysis Engine & Difference Detection
// ---------------------------------------------------------------------------

function performAnalysis(
  project: {
    hourlyRate: number;
    budget: number;
    scopeItems: string[];
    outOfScope: string[];
    client: string;
    contract: string;
  },
  changedRequirement: string,
  subject: string,
  currencySymbol: string = "₹",
) {
  const content = (subject + " " + changedRequirement).toLowerCase();

  const addedFeatures: string[] = [];
  const removedFeatures: string[] = [];
  const modifiedFeatures: string[] = [];
  const missingRequirements: string[] = [];

  let timelineChanges = false;
  let priorityChanges = false;

  let additionalHours = 0;

  // 1. Identify added features (explicit exclusions or keyword checks)
  for (const item of project.outOfScope || []) {
    if (content.includes(item.toLowerCase())) {
      addedFeatures.push(item);
    }
  }

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
      if (!addedFeatures.includes(item.label)) {
        addedFeatures.push(item.label);
      }
      additionalHours += item.hours;
    }
  }

  // 2. Identify modified features (indicators of replacement/modification)
  const modificationIndicators = [
    "instead of",
    "replace",
    "modify",
    "update",
    "change",
    "switch",
    "alter",
    "upgrade",
  ];
  for (const ind of modificationIndicators) {
    if (content.includes(ind)) {
      for (const item of project.scopeItems || []) {
        if (content.includes(item.toLowerCase()) && !modifiedFeatures.includes(item)) {
          modifiedFeatures.push(item);
          additionalHours += 8; // baseline modification hours
        }
      }
      break;
    }
  }

  // 3. Identify removed features (indicators of dropping scope items)
  const removalIndicators = [
    "remove",
    "delete",
    "omit",
    "exclude",
    "drop",
    "cancel",
    "no longer need",
    "without",
  ];
  for (const ind of removalIndicators) {
    if (content.includes(ind)) {
      for (const item of project.scopeItems || []) {
        if (content.includes(item.toLowerCase()) && !removedFeatures.includes(item)) {
          removedFeatures.push(item);
        }
      }
      break;
    }
  }

  // 4. Identify timeline and priority alerts
  if (content.match(/launch|schedule|deadline|timeline|date|days|weeks|months|milestone|urgency/)) {
    timelineChanges = true;
  }
  if (content.match(/urgent|priority|critical|rush|asap|delay|postpone/)) {
    priorityChanges = true;
  }

  // 5. Deduce missing requirements details needed from client
  if (content.includes("voice") && !content.includes("language")) {
    missingRequirements.push("Specification of supported voice recognition languages.");
  }
  if ((content.includes("ios") || content.includes("android")) && !content.includes("store")) {
    missingRequirements.push("App Store deployment keys and publisher account details.");
  }
  if (content.includes("integration") && !content.includes("api documentation")) {
    missingRequirements.push("API documentation and sandbox access for third-party endpoints.");
  }

  // 6. Verdict and estimations
  let verdict: "in_scope" | "possible_scope_creep" | "confirmed_scope_creep" = "in_scope";
  if (addedFeatures.length > 0) {
    verdict = additionalHours > 50 ? "confirmed_scope_creep" : "possible_scope_creep";
  } else if (modifiedFeatures.length > 0) {
    verdict = "possible_scope_creep";
  }

  const hourlyRate = project.hourlyRate || 150;
  const suggestedCost = additionalHours * hourlyRate;
  const timelineImpactDays = Math.ceil(additionalHours / 6);
  const confidence = verdict === "in_scope" ? 98 : Math.floor(Math.random() * 9) + 90; // 90-98%
  const riskLevel: "low" | "medium" | "high" =
    additionalHours > 50 ? "high" : additionalHours > 15 ? "medium" : "low";

  // 7. Textual summary & reply drafts
  let aiSummary = "";
  let explanation = "";
  if (verdict === "in_scope") {
    aiSummary = "Requested adjustments cleared as in-scope.";
    explanation = `The requested adjustments fit within the original contract scope items (${project.scopeItems.slice(0, 2).join(", ") || "defined deliverables"}). No budget or timeline adjustments are needed.`;
  } else {
    aiSummary = `Scope creep warning: ${addedFeatures.length} addition(s) and ${modifiedFeatures.length} modification(s) detected.`;
    explanation = `The request introduces new features outside the Statement of Work: ${addedFeatures.join(", ")}. Incorporating this will require an estimated ${additionalHours} hours of development, costing an extra ${formatCurrency(suggestedCost, currencySymbol)} and adding approximately ${timelineImpactDays} days to the timeline.`;
  }

  const clientName = project.client.split(" ")[0] || "Client";
  let suggestedReply = "";
  if (verdict === "in_scope") {
    suggestedReply = `Hi ${clientName},\n\nThanks for reaching out! Happy to confirm that this falls within our agreed scope of work. We'll proceed with this and keep you updated on progress.\n\nBest,\nAlex`;
  } else {
    suggestedReply =
      `Hi ${clientName},\n\nThanks — glad the progress is landing well.\n\nRegarding the additions of ${addedFeatures.join(" and ")}: these fall outside our current statement of work. I'm happy to take them on, but I want to be upfront about the project impact so there are no surprises:\n\n` +
      `• Combined effort: +${additionalHours} hours\n` +
      `• Budget impact: +${formatCurrency(suggestedCost, currencySymbol)}\n` +
      `• Timeline: adds approximately ${timelineImpactDays} days\n\n` +
      `If you'd like, I can draft a short change order covering these, or we can phase them for a post-launch v1.1. Let me know what you prefer!\n\nBest,\nAlex`;
  }

  const priority: "low" | "medium" | "high" =
    priorityChanges || riskLevel === "high" ? "high" : riskLevel === "medium" ? "medium" : "low";
  const outOfScopeFeatures = addedFeatures;
  const includedFeatures = project.scopeItems.filter((item) =>
    content.includes(item.toLowerCase()),
  );

  return {
    verdict,
    confidence,
    riskLevel,
    additionalHours,
    timelineImpactDays,
    suggestedCost,
    includedFeatures,
    outOfScopeFeatures,
    reasoning: explanation,
    aiSummary,
    explanation,
    detectedFeatures: [...addedFeatures, ...modifiedFeatures],
    missingRequirements,
    priority,
    suggestedReply,
  };
}

async function performAiAnalysis(
  project: {
    hourlyRate: number;
    budget: number;
    scopeItems: string[];
    outOfScope: string[];
    client: string;
    contract: string;
    name?: string;
  },
  changedRequirement: string,
  subject: string,
) {
  const { analyzeScopeWithAI } = await import("./ai/service");
  return analyzeScopeWithAI({
    projectName: project.name || "Software Project",
    clientName: project.client,
    hourlyRate: project.hourlyRate,
    budget: project.budget,
    scopeItems: project.scopeItems,
    outOfScopeItems: project.outOfScope,
    contractTerms: project.contract,
    subject,
    changedRequirement,
  });
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
  verdict: z.enum([
    "in_scope",
    "possible_scope_creep",
    "confirmed_scope_creep",
    "out_of_scope",
    "mixed",
  ]),
  confidence: z.number().min(0).max(100),
  additionalHours: z.number().min(0).optional(),
  timelineImpactDays: z.number().min(0).optional(),
  suggestedCost: z.number().min(0).optional(),
  includedFeatures: z.array(z.string()).optional(),
  outOfScopeFeatures: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
  suggestedReply: z.string().optional(),
  aiSummary: z.string().optional(),
  explanation: z.string().optional(),
  detectedFeatures: z.array(z.string()).optional(),
  missingRequirements: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["active", "pending", "resolved"]).optional(),
});

const runScopeAnalysisSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  originalRequirement: z.string().min(1, "Original requirement is required"),
  changedRequirement: z.string().min(1, "Changed requirement is required"),
});

const analyzeEmailSchema = z.object({
  emailId: z.string().min(1, "Email ID is required"),
});

const updateAnalysisSchema = z.object({
  id: z.string().min(1, "Analysis ID is required"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["active", "pending", "resolved"]).optional(),
  verdict: z
    .enum(["in_scope", "possible_scope_creep", "confirmed_scope_creep", "out_of_scope", "mixed"])
    .optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  suggestedReply: z.string().optional(),
  pinned: z.boolean().optional(),
  bookmarked: z.boolean().optional(),
  archived: z.boolean().optional(),
});

const deleteAnalysisSchema = z.object({
  id: z.string().min(1, "Analysis ID is required"),
});

// ---------------------------------------------------------------------------
// Server Functions (CRUD)
// ---------------------------------------------------------------------------

/**
 * Returns all analyses for a project.
 * Verifies project ownership first.
 */
export const listAnalysesForProject = createServerFn({ method: "GET" })
  .validator((data: unknown) => listAnalysesSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
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
  const { requireSession } = await import("./authorize.server");
  const { connectToDatabase } = await import("./db");
  const { Analysis } = await import("../models/Analysis");
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
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const user = await requireSession();
    await connectToDatabase();

    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new AppError(404, "Analysis not found.");
    return serialize(analysis);
  });

/**
 * Returns the analysis along with its parent project and email details in one trip.
 */
export const getAnalysisDetails = createServerFn({ method: "GET" })
  .validator((data: unknown) => getAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const { EmailThread } = await import("../models/EmailThread");
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
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const { EmailThread } = await import("../models/EmailThread");
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
      userId: user._id,
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

      // Extended fields
      aiSummary: data.aiSummary ?? "",
      explanation: data.explanation ?? reasoning,
      detectedFeatures: data.detectedFeatures ?? [],
      missingRequirements: data.missingRequirements ?? [],
      priority: data.priority ?? "medium",
      status: data.status ?? "active",
    });

    await analysis.save();

    await EmailThread.findOneAndUpdate(
      { _id: data.emailId, owner: user._id },
      { analyzed: true, risk: riskLevel },
    );

    return serialize(analysis.toObject());
  });

/**
 * Updates an analysis document (Steps 3 — CRUD).
 */
export const updateAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const user = await requireSession();
    await connectToDatabase();

    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id });
    if (!analysis) throw new AppError(404, "Analysis not found.");

    if (data.priority !== undefined) analysis.priority = data.priority;
    if (data.status !== undefined) analysis.status = data.status;
    if (data.verdict !== undefined) analysis.verdict = data.verdict;
    if (data.riskLevel !== undefined) analysis.riskLevel = data.riskLevel;
    if (data.suggestedReply !== undefined) analysis.suggestedReply = data.suggestedReply;
    if (data.pinned !== undefined) analysis.pinned = data.pinned;
    if (data.bookmarked !== undefined) analysis.bookmarked = data.bookmarked;
    if (data.archived !== undefined) analysis.archived = data.archived;

    await analysis.save();
    return serialize(analysis.toObject());
  });

/**
 * Deletes an analysis document (Steps 3 — CRUD).
 */
export const deleteAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { EmailThread } = await import("../models/EmailThread");
    const user = await requireSession();
    await connectToDatabase();

    const deleted = await Analysis.findOneAndDelete({ _id: data.id, owner: user._id });
    if (!deleted) throw new AppError(404, "Analysis not found.");

    // If there was an email associated, toggle it back to unanalyzed
    if (deleted.emailId) {
      await EmailThread.findOneAndUpdate(
        { _id: deleted.emailId, owner: user._id },
        { analyzed: false, risk: "low" },
      );
    }

    return { success: true };
  });

/**
 * Runs scope analysis on manual requirements.
 */
export const runScopeAnalysis = createServerFn({ method: "POST" })
  .validator((data: unknown) => runScopeAnalysisSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const { notifyUser } = await import("./notifications.server");
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOne({ _id: data.projectId, owner: user._id });
    if (!project) throw new AppError(404, "Project not found.");

    const analysisResult = await performAiAnalysis(
      {
        hourlyRate: project.hourlyRate,
        budget: project.budget,
        scopeItems: project.scopeItems,
        outOfScope: project.outOfScope,
        client: project.client,
        contract: project.contract || "",
      },
      data.changedRequirement,
      "Manual requirement analysis",
    );

    const analysis = new Analysis({
      owner: user._id,
      userId: user._id,
      projectId: project._id,
      originalRequirement: data.originalRequirement,
      changedRequirement: data.changedRequirement,
      aiExplanation: analysisResult.explanation || analysisResult.reasoning,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      riskLevel: analysisResult.riskLevel,
      additionalHours: analysisResult.estimatedExtraHours ?? analysisResult.additionalHours ?? 0,
      timelineImpactDays: analysisResult.timelineImpactDays ?? 0,
      suggestedCost: analysisResult.estimatedExtraCost ?? analysisResult.suggestedCost ?? 0,
      includedFeatures: analysisResult.addedRequirements || [],
      outOfScopeFeatures: analysisResult.addedRequirements || [],
      reasoning: analysisResult.reasoning,
      suggestedReply: analysisResult.suggestedReply,

      // Extended AI fields
      aiSummary: analysisResult.executiveSummary || analysisResult.reasoning,
      explanation: analysisResult.technicalExplanation || analysisResult.reasoning,
      executiveSummary: analysisResult.executiveSummary,
      technicalExplanation: analysisResult.technicalExplanation,
      potentialRisks: analysisResult.potentialRisks || [],
      recommendations: analysisResult.recommendations || [],
      addedRequirements: analysisResult.addedRequirements || [],
      removedRequirements: analysisResult.removedRequirements || [],
      modifiedRequirements: analysisResult.modifiedRequirements || [],
      missingRequirements: analysisResult.missingRequirements || [],
      clientFriendlinessScore: analysisResult.clientFriendlinessScore ?? 85,
      priority: analysisResult.priority || "medium",
      status: "active",
      aiModel: analysisResult.aiModel,
      promptVersion: analysisResult.promptVersion,
      tokensUsed: analysisResult.tokensUsed,
      processingTime: analysisResult.processingTime,
      isFallback: analysisResult.isFallback,
    });

    await analysis.save();

    const isHighRisk =
      analysisResult.riskLevel === "high" ||
      analysisResult.verdict === "out_of_scope" ||
      analysisResult.verdict === "confirmed_scope_creep";

    await notifyUser({
      userId: user._id,
      title: isHighRisk ? "High Risk Scope Creep Detected" : "Scope Analysis Completed",
      message: `Project "${project.name}": ${analysisResult.aiSummary || "Analysis finished successfully."}`,
      type: isHighRisk ? "high_risk" : "analysis_completed",
      priority: isHighRisk ? "high" : "medium",
      entityType: "analysis",
      entityId: String(analysis._id),
      actionUrl: `/app/analysis/${analysis._id}`,
      metadata: {
        verdict: analysisResult.verdict,
        suggestedCost: analysisResult.suggestedCost,
        additionalHours: analysisResult.additionalHours,
      },
    });

    return serialize(analysis.toObject());
  });

/**
 * Analyzes an unanalyzed email thread using the automated Scope Analysis Engine.
 */
export const analyzeEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => analyzeEmailSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const { EmailThread } = await import("../models/EmailThread");
    const { notifyUser } = await import("./notifications.server");
    const user = await requireSession();
    await connectToDatabase();

    const email = await EmailThread.findOne({ _id: data.emailId, owner: user._id });
    if (!email) throw new AppError(404, "Email thread not found.");

    const project = await Project.findOne({ _id: email.projectId, owner: user._id });
    if (!project) throw new AppError(404, "Project not found.");

    const existing = await Analysis.findOne({ emailId: email._id, owner: user._id }).lean();
    if (existing) return serialize(existing);

    const analysisResult = await performAiAnalysis(
      {
        hourlyRate: project.hourlyRate,
        budget: project.budget,
        scopeItems: project.scopeItems,
        outOfScope: project.outOfScope,
        client: project.client,
        contract: project.contract || "",
      },
      email.body,
      email.subject,
    );

    const analysis = new Analysis({
      owner: user._id,
      userId: user._id,
      projectId: project._id,
      emailId: email._id,
      originalRequirement: project.contract || project.scopeItems.join(", "),
      changedRequirement: email.body,
      aiExplanation: analysisResult.explanation || analysisResult.reasoning,
      verdict: analysisResult.verdict,
      confidence: analysisResult.confidence,
      riskLevel: analysisResult.riskLevel,
      additionalHours: analysisResult.estimatedExtraHours ?? analysisResult.additionalHours ?? 0,
      timelineImpactDays: analysisResult.timelineImpactDays ?? 0,
      suggestedCost: analysisResult.estimatedExtraCost ?? analysisResult.suggestedCost ?? 0,
      includedFeatures: analysisResult.addedRequirements || [],
      outOfScopeFeatures: analysisResult.addedRequirements || [],
      reasoning: analysisResult.reasoning,
      suggestedReply: analysisResult.suggestedReply,

      // Extended AI fields
      aiSummary: analysisResult.executiveSummary || analysisResult.reasoning,
      explanation: analysisResult.technicalExplanation || analysisResult.reasoning,
      executiveSummary: analysisResult.executiveSummary,
      technicalExplanation: analysisResult.technicalExplanation,
      potentialRisks: analysisResult.potentialRisks || [],
      recommendations: analysisResult.recommendations || [],
      addedRequirements: analysisResult.addedRequirements || [],
      removedRequirements: analysisResult.removedRequirements || [],
      modifiedRequirements: analysisResult.modifiedRequirements || [],
      missingRequirements: analysisResult.missingRequirements || [],
      clientFriendlinessScore: analysisResult.clientFriendlinessScore ?? 85,
      priority: analysisResult.priority || "medium",
      status: "active",
      aiModel: analysisResult.aiModel,
      promptVersion: analysisResult.promptVersion,
      tokensUsed: analysisResult.tokensUsed,
      processingTime: analysisResult.processingTime,
      isFallback: analysisResult.isFallback,
    });

    await analysis.save();

    email.analyzed = true;
    email.risk = analysisResult.riskLevel;
    await email.save();

    const isHighRisk =
      analysisResult.riskLevel === "high" ||
      analysisResult.verdict === "out_of_scope" ||
      analysisResult.verdict === "confirmed_scope_creep";

    await notifyUser({
      userId: user._id,
      title: isHighRisk ? "High Risk Scope Creep Detected" : "Email Thread Analyzed",
      message: `Project "${project.name}" email from ${email.from}: ${analysisResult.aiSummary || "Analysis completed."}`,
      type: isHighRisk ? "high_risk" : "analysis_completed",
      priority: isHighRisk ? "high" : "medium",
      entityType: "analysis",
      entityId: String(analysis._id),
      actionUrl: `/app/analysis/${analysis._id}`,
      metadata: {
        verdict: analysisResult.verdict,
        emailSubject: email.subject,
      },
    });

    return serialize(analysis.toObject());
  });

// ---------------------------------------------------------------------------
// Query and Bulk Operations Schemas
// ---------------------------------------------------------------------------

const queryAnalysesSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().optional(),
  risk: z.enum(["low", "medium", "high", "all"]).optional(),
  verdict: z
    .enum([
      "in_scope",
      "possible_scope_creep",
      "confirmed_scope_creep",
      "out_of_scope",
      "mixed",
      "all",
    ])
    .optional(),
  status: z.enum(["active", "pending", "resolved", "all"]).optional(),
  priority: z.enum(["low", "medium", "high", "all"]).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  pinnedOnly: z.boolean().optional(),
  bookmarkedOnly: z.boolean().optional(),
  archivedOnly: z.boolean().optional(),
  sortBy: z
    .enum([
      "newest",
      "oldest",
      "highest_risk",
      "highest_confidence",
      "highest_cost",
      "highest_hours",
    ])
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

const bulkDeleteAnalysesSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

const bulkChangeAnalysesStatusSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  status: z.enum(["active", "pending", "resolved"]),
});

const bulkArchiveAnalysesSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  archived: z.boolean(),
});

// ---------------------------------------------------------------------------
// Query and Bulk Server Functions
// ---------------------------------------------------------------------------

/**
 * Server-side paginated, sorted, and filtered query engine for analyses.
 */
export const queryAnalyses = createServerFn({ method: "POST" })
  .validator((data: unknown) => queryAnalysesSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const mongoose = (await import("mongoose")).default;
    const user = await requireSession();
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { owner: user._id };

    // Pinned / Bookmarked / Archived Filters
    if (data.pinnedOnly) {
      query.pinned = true;
    }
    if (data.bookmarkedOnly) {
      query.bookmarked = true;
    }
    if (data.archivedOnly !== undefined) {
      query.archived = data.archivedOnly;
    } else {
      // By default, exclude archived analyses unless explicitly requested
      query.archived = { $ne: true };
    }

    // Projects Filter
    if (data.projectId) {
      query.projectId = new mongoose.Types.ObjectId(data.projectId);
    }

    // Risk Filter
    if (data.risk && data.risk !== "all") {
      query.riskLevel = data.risk;
    }

    // Verdict Filter
    if (data.verdict && data.verdict !== "all") {
      query.verdict = data.verdict;
    }

    // Status Filter
    if (data.status && data.status !== "all") {
      query.status = data.status;
    }

    // Priority Filter
    if (data.priority && data.priority !== "all") {
      query.priority = data.priority;
    }

    // Date Range Filter
    if (data.dateStart || data.dateEnd) {
      query.createdAt = {};
      if (data.dateStart) {
        query.createdAt.$gte = new Date(data.dateStart);
      }
      if (data.dateEnd) {
        const end = new Date(data.dateEnd);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Global Search Filter
    if (data.search) {
      const searchRegex = new RegExp(data.search, "i");

      // Step 1: Find projects matching project name search
      const matchingProjects = await Project.find({
        owner: user._id,
        name: { $regex: searchRegex },
      })
        .select("_id")
        .lean();
      const projIds = matchingProjects.map((p) => p._id);

      // Step 2: Combine regex matches on other fields and projectId matches
      query.$or = [
        { projectId: { $in: projIds } },
        { changedRequirement: { $regex: searchRegex } },
        { originalRequirement: { $regex: searchRegex } },
        { aiSummary: { $regex: searchRegex } },
        { explanation: { $regex: searchRegex } },
        { verdict: { $regex: searchRegex } },
        { riskLevel: { $regex: searchRegex } },
        { status: { $regex: searchRegex } },
      ];
    }

    // Sorting
    const sortObj: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest
    if (data.sortBy === "oldest") {
      sortObj.createdAt = 1;
    } else if (data.sortBy === "highest_risk") {
      sortObj.additionalHours = -1;
      sortObj.suggestedCost = -1;
    } else if (data.sortBy === "highest_confidence") {
      sortObj.confidence = -1;
      sortObj.createdAt = -1; // delete default createdAt to avoid conflicts or let it be
    } else if (data.sortBy === "highest_cost") {
      sortObj.suggestedCost = -1;
      sortObj.createdAt = -1;
    } else if (data.sortBy === "highest_hours") {
      sortObj.additionalHours = -1;
      sortObj.createdAt = -1;
    }

    // Pagination
    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    // Execute query with populate using projection to optimize DB retrieval
    const [docs, totalCount] = await Promise.all([
      Analysis.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("projectId", "name client")
        .lean(),
      Analysis.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Format output including populated project fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analyses = docs.map((doc: any) => {
      const serialized = serialize(doc);
      return {
        ...serialized,
        projectName: doc.projectId?.name || "Deleted Project",
        clientName: doc.projectId?.client || "Deleted Client",
      };
    });

    return {
      analyses,
      totalCount,
      totalPages,
      currentPage: page,
    };
  });

/**
 * Bulk deletes analyses. Mark associated emails as unanalyzed.
 */
export const bulkDeleteAnalyses = createServerFn({ method: "POST" })
  .validator((data: unknown) => bulkDeleteAnalysesSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { EmailThread } = await import("../models/EmailThread");
    const mongoose = (await import("mongoose")).default;
    const user = await requireSession();
    await connectToDatabase();

    const ids = data.ids.map((id) => new mongoose.Types.ObjectId(id));

    // Get analyses first to see if any have associated emailIds to toggle
    const analysesToToggle = await Analysis.find({
      _id: { $in: ids },
      owner: user._id,
      emailId: { $exists: true },
    })
      .select("emailId")
      .lean();

    const emailIds = analysesToToggle
      .map((a) => a.emailId)
      .filter((id): id is NonNullable<typeof id> => Boolean(id));

    // Perform bulk delete
    const result = await Analysis.deleteMany({
      _id: { $in: ids },
      owner: user._id,
    });

    // Mark associated emails back as unanalyzed
    if (emailIds.length > 0) {
      await EmailThread.updateMany(
        { _id: { $in: emailIds }, owner: user._id },
        { $set: { analyzed: false, risk: "low" } },
      );
    }

    return { deletedCount: result.deletedCount };
  });

/**
 * Bulk updates the status of analyses.
 */
export const bulkChangeAnalysesStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => bulkChangeAnalysesStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const mongoose = (await import("mongoose")).default;
    const user = await requireSession();
    await connectToDatabase();

    const ids = data.ids.map((id) => new mongoose.Types.ObjectId(id));

    const result = await Analysis.updateMany(
      { _id: { $in: ids }, owner: user._id },
      { $set: { status: data.status } },
    );

    return { modifiedCount: result.modifiedCount };
  });

/**
 * Bulk archives or unarchives analyses.
 */
export const bulkArchiveAnalyses = createServerFn({ method: "POST" })
  .validator((data: unknown) => bulkArchiveAnalysesSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const mongoose = (await import("mongoose")).default;
    const user = await requireSession();
    await connectToDatabase();

    const ids = data.ids.map((id) => new mongoose.Types.ObjectId(id));

    const result = await Analysis.updateMany(
      { _id: { $in: ids }, owner: user._id },
      { $set: { archived: data.archived } },
    );

    return { modifiedCount: result.modifiedCount };
  });
