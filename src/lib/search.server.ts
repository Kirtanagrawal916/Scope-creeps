/**
 * search.server.ts — Ownership-scoped, production-grade Global Search System.
 *
 * SECURITY & IDOR PREVENTION CONTRACT:
 * Every search query MUST include `{ owner: user._id }` or `{ userId: user._id }`.
 * Never leak another user's data under any circumstances.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { formatRelativeDate } from "./utils";
import type { Types } from "mongoose";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type SearchCategory =
  "all" | "projects" | "clients" | "analyses" | "notifications" | "emails";

export type SearchResultType = "project" | "client" | "analysis" | "notification" | "email";

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  snippet?: string;
  url: string;
  category: SearchCategory;
  updatedAt?: string;
  createdAt: string;
  pinned?: boolean;
  archived?: boolean;
  risk?: "low" | "medium" | "high";
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  verdict?: string;
  confidence?: number;
  clientName?: string;
  clientInitials?: string;
  projectCount?: number;
  unread?: boolean;
  analyzed?: boolean;
  sender?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GlobalSearchResponse {
  query: string;
  category: SearchCategory;
  totalResults: number;
  counts: {
    all: number;
    projects: number;
    clients: number;
    analyses: number;
    notifications: number;
    emails: number;
  };
  results: SearchResultItem[];
  parsedFilters: ParsedSearchQuery;
}

// ---------------------------------------------------------------------------
// Input Validation Schemas
// ---------------------------------------------------------------------------

export const searchInputSchema = z.object({
  query: z.string().max(100, "Search query is too long").default(""),
  category: z
    .enum(["all", "projects", "clients", "analyses", "notifications", "emails"])
    .default("all"),
  limit: z.number().min(1).max(100).default(30),
});

export const quickActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["mark_read", "toggle_pin", "archive_project"]),
});

// ---------------------------------------------------------------------------
// Query Parser & Regex Helpers
// ---------------------------------------------------------------------------

export interface ParsedSearchQuery {
  raw: string;
  textTerms: string[];
  projectFilter?: string;
  clientFilter?: string;
  riskFilter?: "low" | "medium" | "high";
  priorityFilter?: "low" | "medium" | "high" | "urgent";
  statusFilter?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  dateRangeDays?: number;
}

/**
 * Escapes regex control characters to eliminate ReDoS vulnerabilities.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes fuzzy terms for improved retrieval.
 */
export function buildFuzzyRegex(term: string): RegExp {
  const clean = term.trim().toLowerCase();

  // Common shortcuts/typos handling
  if (clean === "analys" || clean === "analy" || clean === "anlys") {
    return new RegExp("analys|analysis|analyses", "i");
  }
  if (clean === "notif" || clean === "notifi" || clean === "notifn") {
    return new RegExp("notif|notification", "i");
  }
  if (clean === "proj" || clean === "prj") {
    return new RegExp("proj|project", "i");
  }
  if (clean === "scope") {
    return new RegExp("scope|scopeguard|creep", "i");
  }

  const escaped = escapeRegex(clean);
  return new RegExp(escaped, "i");
}

/**
 * Parses structured tokens like project:ScopeGuard, risk:high, date:last30days, confidence>80.
 */
export function parseQuerySyntax(rawQuery: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = {
    raw: rawQuery,
    textTerms: [],
  };

  if (!rawQuery.trim()) return result;

  const tokens = rawQuery.trim().split(/\s+/);

  for (const token of tokens) {
    if (token.includes(":")) {
      const [key, val] = token.split(":", 2);
      const lowerKey = key.toLowerCase();
      const cleanVal = val ? val.trim() : "";

      if (!cleanVal) continue;

      if (lowerKey === "project" || lowerKey === "prj") {
        result.projectFilter = cleanVal;
      } else if (lowerKey === "client" || lowerKey === "customer") {
        result.clientFilter = cleanVal;
      } else if (lowerKey === "risk") {
        const valLower = cleanVal.toLowerCase();
        if (valLower === "low" || valLower === "medium" || valLower === "high") {
          result.riskFilter = valLower;
        }
      } else if (lowerKey === "priority") {
        const valLower = cleanVal.toLowerCase();
        if (
          valLower === "low" ||
          valLower === "medium" ||
          valLower === "high" ||
          valLower === "urgent"
        ) {
          result.priorityFilter = valLower;
        }
      } else if (lowerKey === "status") {
        result.statusFilter = cleanVal.toLowerCase();
      } else if (lowerKey === "date") {
        const dLower = cleanVal.toLowerCase();
        if (dLower === "today") result.dateRangeDays = 1;
        else if (dLower === "last7days" || dLower === "7days" || dLower === "week")
          result.dateRangeDays = 7;
        else if (dLower === "last30days" || dLower === "30days" || dLower === "month")
          result.dateRangeDays = 30;
      } else if (lowerKey === "analysis" || lowerKey === "verdict") {
        result.textTerms.push(cleanVal);
      } else {
        result.textTerms.push(token);
      }
    } else if (token.includes(">")) {
      const [key, val] = token.split(">", 2);
      if (key.toLowerCase() === "confidence" && !isNaN(Number(val))) {
        result.confidenceMin = Number(val);
      } else {
        result.textTerms.push(token);
      }
    } else if (token.includes("<")) {
      const [key, val] = token.split("<", 2);
      if (key.toLowerCase() === "confidence" && !isNaN(Number(val))) {
        result.confidenceMax = Number(val);
      } else {
        result.textTerms.push(token);
      }
    } else {
      result.textTerms.push(token);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Server Search Handlers
// ---------------------------------------------------------------------------

/**
 * Searches Projects table scoped to owner.
 */
export async function searchProjectsCore(
  userId: Types.ObjectId,
  parsed: ParsedSearchQuery,
  limit = 20,
): Promise<SearchResultItem[]> {
  const { Project } = await import("../models/Project");

  // Base query: Strict ownership enforcement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFilter: Record<string, any> = { owner: userId };

  if (parsed.projectFilter) {
    queryFilter.name = buildFuzzyRegex(parsed.projectFilter);
  }
  if (parsed.clientFilter) {
    queryFilter.client = buildFuzzyRegex(parsed.clientFilter);
  }
  if (parsed.riskFilter) {
    queryFilter.risk = parsed.riskFilter;
  }
  if (parsed.statusFilter) {
    queryFilter.status = buildFuzzyRegex(parsed.statusFilter);
  }
  if (parsed.dateRangeDays) {
    const cutoff = new Date(Date.now() - parsed.dateRangeDays * 24 * 60 * 60 * 1000);
    queryFilter.updatedAt = { $gte: cutoff };
  }

  if (parsed.textTerms.length > 0) {
    const textRegexes = parsed.textTerms.map(buildFuzzyRegex);
    queryFilter.$or = [
      { name: { $in: textRegexes } },
      { client: { $in: textRegexes } },
      { contract: { $in: textRegexes } },
      { scopeItems: { $in: textRegexes } },
      { outOfScope: { $in: textRegexes } },
    ];
  }

  const projects = await Project.find(queryFilter)
    .select("name client clientInitials budget risk status contract archived updatedAt createdAt")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return projects.map((p) => ({
    id: String(p._id),
    type: "project" as const,
    title: p.name,
    subtitle: `Client: ${p.client} • Budget: ₹${(p.budget ?? 0).toLocaleString()}`,
    snippet: p.contract ? p.contract.slice(0, 90) + "..." : undefined,
    url: `/app/projects/${p._id}`,
    category: "projects" as const,
    updatedAt: formatRelativeDate(p.updatedAt),
    createdAt: new Date(p.createdAt).toISOString(),
    archived: p.archived ?? false,
    risk: p.risk,
    status: p.status,
    clientName: p.client,
    clientInitials: p.clientInitials || p.client.slice(0, 2).toUpperCase(),
  }));
}

/**
 * Searches Clients (Aggregated from Projects & User context) scoped to owner.
 */
export async function searchClientsCore(
  userId: Types.ObjectId,
  parsed: ParsedSearchQuery,
  limit = 20,
): Promise<SearchResultItem[]> {
  const { Project } = await import("../models/Project");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchFilter: Record<string, any> = { owner: userId };
  if (parsed.clientFilter) {
    matchFilter.client = buildFuzzyRegex(parsed.clientFilter);
  }

  const aggregate = await Project.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: "$client",
        projectCount: { $sum: 1 },
        clientInitials: { $first: "$clientInitials" },
        lastUpdated: { $max: "$updatedAt" },
        createdAt: { $min: "$createdAt" },
        riskLevels: { $push: "$risk" },
        totalBudget: { $sum: "$budget" },
      },
    },
    { $sort: { lastUpdated: -1 } },
    { $limit: limit },
  ]);

  let results = aggregate.map((c) => {
    const highestRisk = c.riskLevels.includes("high")
      ? "high"
      : c.riskLevels.includes("medium")
        ? "medium"
        : "low";
    return {
      id: `client-${encodeURIComponent(c._id)}`,
      type: "client" as const,
      title: c._id,
      subtitle: `${c.projectCount} project${c.projectCount === 1 ? "" : "s"} • Total Budget: ₹${(c.totalBudget ?? 0).toLocaleString()}`,
      url: `/app/projects?client=${encodeURIComponent(c._id)}`,
      category: "clients" as const,
      updatedAt: formatRelativeDate(c.lastUpdated),
      createdAt: new Date(c.createdAt || Date.now()).toISOString(),
      clientName: c._id,
      clientInitials: c.clientInitials || String(c._id).slice(0, 2).toUpperCase(),
      projectCount: c.projectCount,
      risk: highestRisk as "low" | "medium" | "high",
    };
  });

  if (parsed.textTerms.length > 0) {
    const regexes = parsed.textTerms.map(buildFuzzyRegex);
    results = results.filter((c) => regexes.some((r) => r.test(c.title)));
  }

  return results;
}

/**
 * Searches Scope Analyses table scoped to owner.
 */
export async function searchAnalysesCore(
  userId: Types.ObjectId,
  parsed: ParsedSearchQuery,
  limit = 20,
): Promise<SearchResultItem[]> {
  const { Analysis } = await import("../models/Analysis");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFilter: Record<string, any> = {
    $or: [{ owner: userId }, { userId: userId }],
  };

  if (parsed.riskFilter) {
    queryFilter.riskLevel = parsed.riskFilter;
  }
  if (parsed.priorityFilter) {
    queryFilter.priority = parsed.priorityFilter;
  }
  if (parsed.statusFilter) {
    queryFilter.status = buildFuzzyRegex(parsed.statusFilter);
  }
  if (parsed.confidenceMin !== undefined) {
    queryFilter.confidence = { $gte: parsed.confidenceMin };
  }
  if (parsed.confidenceMax !== undefined) {
    queryFilter.confidence = {
      ...(queryFilter.confidence || {}),
      $lte: parsed.confidenceMax,
    };
  }
  if (parsed.dateRangeDays) {
    const cutoff = new Date(Date.now() - parsed.dateRangeDays * 24 * 60 * 60 * 1000);
    queryFilter.createdAt = { $gte: cutoff };
  }

  if (parsed.textTerms.length > 0) {
    const regexes = parsed.textTerms.map(buildFuzzyRegex);
    queryFilter.$and = [
      ...(queryFilter.$and || []),
      {
        $or: [
          { aiSummary: { $in: regexes } },
          { verdict: { $in: regexes } },
          { explanation: { $in: regexes } },
          { aiExplanation: { $in: regexes } },
          { originalRequirement: { $in: regexes } },
          { changedRequirement: { $in: regexes } },
          { missingRequirements: { $in: regexes } },
          { detectedFeatures: { $in: regexes } },
        ],
      },
    ];
  }

  const analyses = await Analysis.find(queryFilter)
    .select(
      "aiSummary verdict confidence riskLevel priority pinned status explanation createdAt updatedAt projectId",
    )
    .populate({ path: "projectId", select: "name client", model: "Project" })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return analyses.map((a) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proj = a.projectId as any;
    const projectName = proj?.name || "Workspace Project";

    return {
      id: String(a._id),
      type: "analysis" as const,
      title: a.aiSummary || `Analysis for ${projectName}`,
      subtitle: `Project: ${projectName} • Verdict: ${a.verdict.replace(/_/g, " ")}`,
      snippet: a.explanation ? a.explanation.slice(0, 100) + "..." : undefined,
      url: `/app/analysis/${a._id}`,
      category: "analyses" as const,
      updatedAt: formatRelativeDate(a.updatedAt),
      createdAt: new Date(a.createdAt).toISOString(),
      pinned: a.pinned ?? false,
      risk: a.riskLevel,
      priority: a.priority,
      status: a.status,
      verdict: a.verdict,
      confidence: a.confidence,
    };
  });
}

/**
 * Searches Notifications scoped to owner.
 */
export async function searchNotificationsCore(
  userId: Types.ObjectId,
  parsed: ParsedSearchQuery,
  limit = 20,
): Promise<SearchResultItem[]> {
  const { Notification } = await import("../models/Notification");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFilter: Record<string, any> = { userId };

  if (parsed.priorityFilter) {
    queryFilter.priority = parsed.priorityFilter;
  }
  if (parsed.dateRangeDays) {
    const cutoff = new Date(Date.now() - parsed.dateRangeDays * 24 * 60 * 60 * 1000);
    queryFilter.createdAt = { $gte: cutoff };
  }

  if (parsed.textTerms.length > 0) {
    const regexes = parsed.textTerms.map(buildFuzzyRegex);
    queryFilter.$or = [
      { title: { $in: regexes } },
      { message: { $in: regexes } },
      { type: { $in: regexes } },
    ];
  }

  const notifications = await Notification.find(queryFilter)
    .select("title message priority type isRead actionUrl createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((n) => ({
    id: String(n._id),
    type: "notification" as const,
    title: n.title,
    subtitle: n.message,
    snippet: `Type: ${n.type} • Priority: ${n.priority}`,
    url: n.actionUrl || "/app/notifications",
    category: "notifications" as const,
    createdAt: new Date(n.createdAt).toISOString(),
    updatedAt: formatRelativeDate(n.createdAt),
    priority: n.priority,
    unread: !n.isRead,
  }));
}

/**
 * Searches Email Threads scoped to owner.
 */
export async function searchEmailsCore(
  userId: Types.ObjectId,
  parsed: ParsedSearchQuery,
  limit = 20,
): Promise<SearchResultItem[]> {
  const { EmailThread } = await import("../models/EmailThread");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFilter: Record<string, any> = { owner: userId };

  if (parsed.riskFilter) {
    queryFilter.risk = parsed.riskFilter;
  }
  if (parsed.dateRangeDays) {
    const cutoff = new Date(Date.now() - parsed.dateRangeDays * 24 * 60 * 60 * 1000);
    queryFilter.receivedAt = { $gte: cutoff };
  }

  if (parsed.textTerms.length > 0) {
    const regexes = parsed.textTerms.map(buildFuzzyRegex);
    queryFilter.$or = [
      { subject: { $in: regexes } },
      { from: { $in: regexes } },
      { preview: { $in: regexes } },
      { body: { $in: regexes } },
    ];
  }

  const emails = await EmailThread.find(queryFilter)
    .select("subject from preview receivedAt analyzed risk unread projectId")
    .populate({ path: "projectId", select: "name", model: "Project" })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .lean();

  return emails.map((e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proj = e.projectId as any;
    const projectName = proj?.name || "Project";

    return {
      id: String(e._id),
      type: "email" as const,
      title: e.subject,
      subtitle: `From: ${e.from} • Project: ${projectName}`,
      snippet: e.preview ? e.preview.slice(0, 100) + "..." : undefined,
      url: `/app/inbox?thread=${e._id}`,
      category: "emails" as const,
      createdAt: new Date(e.receivedAt || e.createdAt).toISOString(),
      updatedAt: formatRelativeDate(e.receivedAt || e.createdAt),
      risk: e.risk,
      unread: e.unread ?? false,
      analyzed: e.analyzed ?? false,
      sender: e.from,
    };
  });
}

// ---------------------------------------------------------------------------
// Exported Server Functions for TanStack Start
// ---------------------------------------------------------------------------

/**
 * Main Global Search Server Function
 */
export const globalSearch = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }): Promise<GlobalSearchResponse> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();

    const category = data.category || "all";
    const rawQuery = data.query || "";
    const limit = data.limit || 30;

    const parsed = parseQuerySyntax(rawQuery);

    // Parallel search across all entities using Promise.all() for zero N+1 latency
    const [projectResults, clientResults, analysisResults, notificationResults, emailResults] =
      await Promise.all([
        category === "all" || category === "projects"
          ? searchProjectsCore(user._id, parsed, limit)
          : Promise.resolve([]),
        category === "all" || category === "clients"
          ? searchClientsCore(user._id, parsed, limit)
          : Promise.resolve([]),
        category === "all" || category === "analyses"
          ? searchAnalysesCore(user._id, parsed, limit)
          : Promise.resolve([]),
        category === "all" || category === "notifications"
          ? searchNotificationsCore(user._id, parsed, limit)
          : Promise.resolve([]),
        category === "all" || category === "emails"
          ? searchEmailsCore(user._id, parsed, limit)
          : Promise.resolve([]),
      ]);

    const counts = {
      all:
        projectResults.length +
        clientResults.length +
        analysisResults.length +
        notificationResults.length +
        emailResults.length,
      projects: projectResults.length,
      clients: clientResults.length,
      analyses: analysisResults.length,
      notifications: notificationResults.length,
      emails: emailResults.length,
    };

    let allResults: SearchResultItem[] = [];

    if (category === "all") {
      // Sort pinned items first, then by date
      allResults = [
        ...projectResults,
        ...clientResults,
        ...analysisResults,
        ...notificationResults,
        ...emailResults,
      ].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (category === "projects") {
      allResults = projectResults;
    } else if (category === "clients") {
      allResults = clientResults;
    } else if (category === "analyses") {
      allResults = analysisResults;
    } else if (category === "notifications") {
      allResults = notificationResults;
    } else if (category === "emails") {
      allResults = emailResults;
    }

    return {
      query: rawQuery,
      category,
      totalResults: allResults.length,
      counts,
      results: allResults.slice(0, limit),
      parsedFilters: parsed,
    };
  });

/**
 * Individual Search Server Functions
 */
export const searchProjects = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();
    const parsed = parseQuerySyntax(data.query || "");
    return searchProjectsCore(user._id, parsed, data.limit || 20);
  });

export const searchClients = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();
    const parsed = parseQuerySyntax(data.query || "");
    return searchClientsCore(user._id, parsed, data.limit || 20);
  });

export const searchAnalyses = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();
    const parsed = parseQuerySyntax(data.query || "");
    return searchAnalysesCore(user._id, parsed, data.limit || 20);
  });

export const searchNotifications = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();
    const parsed = parseQuerySyntax(data.query || "");
    return searchNotificationsCore(user._id, parsed, data.limit || 20);
  });

export const searchEmails = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();
    const parsed = parseQuerySyntax(data.query || "");
    return searchEmailsCore(user._id, parsed, data.limit || 20);
  });

/**
 * Quick Action Handler
 */
export const executeQuickAction = createServerFn({ method: "POST" })
  .validator((data: unknown) => quickActionSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const user = await requireSession();
    await connectToDatabase();

    if (data.action === "mark_read") {
      const { Notification } = await import("../models/Notification");
      await Notification.updateOne({ _id: data.id, userId: user._id }, { isRead: true });
      return { success: true, message: "Notification marked as read" };
    }

    if (data.action === "toggle_pin") {
      const { Analysis } = await import("../models/Analysis");
      const analysis = await Analysis.findOne({
        _id: data.id,
        $or: [{ owner: user._id }, { userId: user._id }],
      });
      if (analysis) {
        analysis.pinned = !analysis.pinned;
        await analysis.save();
        return {
          success: true,
          message: analysis.pinned ? "Analysis pinned" : "Analysis unpinned",
          pinned: analysis.pinned,
        };
      }
    }

    if (data.action === "archive_project") {
      const { Project } = await import("../models/Project");
      await Project.updateOne({ _id: data.id, owner: user._id }, { archived: true });
      return { success: true, message: "Project archived" };
    }

    return { success: false, message: "Unknown action" };
  });
