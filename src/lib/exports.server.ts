/**
 * exports.server.ts — Security-hardened, IDOR-protected Server Functions for Export Reports.
 *
 * All queries strictly enforce `{ owner: user._id }` or `{ userId: user._id }`.
 * Uses MongoDB lean projections for optimal memory usage and query execution.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  DashboardExportData,
  ProjectReportData,
  AnalysisReportData,
  AnalyticsReportData,
  WorkspaceExportData,
  ExportPayload,
} from "./export-engine/types";

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const exportFilterSchema = z
  .object({
    riskLevels: z.array(z.enum(["low", "medium", "high"])).optional(),
    priorityLevels: z.array(z.enum(["low", "medium", "high"])).optional(),
    statuses: z.array(z.string()).optional(),
    projectIds: z.array(z.string()).optional(),
    analysisIds: z.array(z.string()).optional(),
    dateRange: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
    searchQuery: z.string().optional(),
  })
  .optional();

const singleTargetSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

const bulkExportSchema = z.object({
  scope: z.enum([
    "dashboard",
    "project",
    "projects_bulk",
    "analysis",
    "analyses_bulk",
    "analytics",
    "workspace",
  ]),
  targetId: z.string().optional(),
  filters: exportFilterSchema,
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Generates export payload for Dashboard scope.
 */
export const getDashboardExport = createServerFn({ method: "POST" })
  .validator((data: unknown) => exportFilterSchema.parse(data))
  .handler(async ({ data }): Promise<ExportPayload> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Project } = await import("../models/Project");
    const { Analysis } = await import("../models/Analysis");
    const user = await requireSession();
    await connectToDatabase();

    const [projects, analyses] = await Promise.all([
      Project.find({ owner: user._id }).lean(),
      Analysis.find({ owner: user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const totalProjects = projects.length;
    const totalAnalyses = analyses.length;

    const scopeCreepAnalyses = analyses.filter(
      (a) =>
        a.verdict === "out_of_scope" ||
        a.verdict === "confirmed_scope_creep" ||
        a.verdict === "possible_scope_creep",
    );
    const scopeCreepCount = scopeCreepAnalyses.length;

    const revenueProtected = scopeCreepAnalyses.reduce((acc, a) => acc + (a.suggestedCost ?? 0), 0);
    const hoursSaved = scopeCreepAnalyses.reduce((acc, a) => acc + (a.additionalHours ?? 0), 0);

    const avgConfidence =
      totalAnalyses > 0
        ? Math.round(analyses.reduce((acc, a) => acc + (a.confidence ?? 0), 0) / totalAnalyses)
        : 100;

    const highRiskProjects = projects
      .filter((p) => p.risk === "high" || p.status === "at_risk" || p.status === "scope_creep")
      .map((p) => ({
        id: String(p._id),
        name: p.name,
        client: p.client,
        budget: p.budget,
        hoursUsed: p.hoursUsed,
        hoursAllocated: p.hoursAllocated,
        risk: p.risk,
        status: p.status,
      }));

    const projectMap = new Map(projects.map((p) => [String(p._id), p.name]));

    const recentScopeChanges = analyses.slice(0, 10).map((a) => ({
      id: String(a._id),
      projectName: projectMap.get(String(a.projectId)) ?? "Unassigned Project",
      originalRequirement: a.originalRequirement || "Initial Specification",
      changedRequirement: a.changedRequirement || a.aiSummary,
      verdict: a.verdict,
      riskLevel: a.riskLevel,
      additionalHours: a.additionalHours ?? 0,
      suggestedCost: a.suggestedCost ?? 0,
      createdAt: new Date(a.createdAt).toISOString().slice(0, 10),
    }));

    const exportData: DashboardExportData = {
      meta: {
        workspaceName: user.workspaceName || `${user.firstName || "User"}'s Workspace`,
        userEmail: user.email,
        generatedAt: new Date().toISOString(),
      },
      stats: {
        totalProjects,
        totalAnalyses,
        scopeCreepCount,
        revenueProtected,
        hoursSaved,
        avgConfidence,
        highRiskProjectsCount: highRiskProjects.length,
      },
      highRiskProjects,
      recentScopeChanges,
    };

    return { type: "dashboard", data: exportData };
  });

/**
 * Generates export payload for a Single Project report.
 */
export const getProjectExport = createServerFn({ method: "POST" })
  .validator((data: unknown) => singleTargetSchema.parse(data))
  .handler(async ({ data }): Promise<ExportPayload> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Project } = await import("../models/Project");
    const { Analysis } = await import("../models/Analysis");
    const user = await requireSession();
    await connectToDatabase();

    const project = await Project.findOne({ _id: data.id, owner: user._id }).lean();
    if (!project) throw new Error("Project not found or unauthorized.");

    const analyses = await Analysis.find({ projectId: project._id, owner: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const scopeCreepAnalyses = analyses.filter(
      (a) =>
        a.verdict === "out_of_scope" ||
        a.verdict === "confirmed_scope_creep" ||
        a.verdict === "possible_scope_creep",
    );

    const totalEstimatedHours = analyses.reduce((acc, a) => acc + (a.additionalHours ?? 0), 0);
    const totalEstimatedCost = analyses.reduce((acc, a) => acc + (a.suggestedCost ?? 0), 0);

    const projectReport: ProjectReportData = {
      id: String(project._id),
      name: project.name,
      client: project.client,
      clientInitials: project.clientInitials,
      budget: project.budget,
      hourlyRate: project.hourlyRate,
      hoursAllocated: project.hoursAllocated,
      hoursUsed: project.hoursUsed,
      progress: project.progress,
      status: project.status,
      risk: project.risk,
      contract: project.contract || "Standard Terms",
      scopeItems: project.scopeItems || [],
      outOfScope: project.outOfScope || [],
      createdAt: new Date(project.createdAt).toISOString().slice(0, 10),
      updatedAt: new Date(project.updatedAt).toISOString().slice(0, 10),
      analyses: analyses.map((a) => ({
        id: String(a._id),
        originalRequirement: a.originalRequirement,
        changedRequirement: a.changedRequirement,
        aiSummary: a.aiSummary || "Analysis completed",
        explanation: a.explanation || a.aiExplanation,
        verdict: a.verdict,
        confidence: a.confidence,
        riskLevel: a.riskLevel,
        additionalHours: a.additionalHours ?? 0,
        suggestedCost: a.suggestedCost ?? 0,
        priority: a.priority,
        status: a.status,
        suggestedReply: a.suggestedReply,
        createdAt: new Date(a.createdAt).toISOString().slice(0, 10),
      })),
      summary: {
        totalAnalysesCount: analyses.length,
        scopeCreepAnalysesCount: scopeCreepAnalyses.length,
        totalEstimatedHours,
        totalEstimatedCost,
        riskScore: project.risk === "high" ? 85 : project.risk === "medium" ? 50 : 15,
      },
    };

    return { type: "project", data: projectReport };
  });

/**
 * Generates export payload for a Single Analysis report.
 */
export const getAnalysisExport = createServerFn({ method: "POST" })
  .validator((data: unknown) => singleTargetSchema.parse(data))
  .handler(async ({ data }): Promise<ExportPayload> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Analysis } = await import("../models/Analysis");
    const { Project } = await import("../models/Project");
    const user = await requireSession();
    await connectToDatabase();

    const analysis = await Analysis.findOne({ _id: data.id, owner: user._id }).lean();
    if (!analysis) throw new Error("Analysis not found or unauthorized.");

    const project = await Project.findOne({ _id: analysis.projectId, owner: user._id }).lean();

    const analysisReport: AnalysisReportData = {
      id: String(analysis._id),
      projectId: String(analysis.projectId),
      projectName: project?.name ?? "Unknown Project",
      clientName: project?.client ?? "Unknown Client",
      emailId: analysis.emailId ? String(analysis.emailId) : undefined,
      originalRequirement: analysis.originalRequirement,
      changedRequirement: analysis.changedRequirement,
      aiSummary: analysis.aiSummary || "Scope Analysis Report",
      aiExplanation: analysis.aiExplanation,
      explanation: analysis.explanation || analysis.aiExplanation,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      riskLevel: analysis.riskLevel,
      additionalHours: analysis.additionalHours ?? 0,
      timelineImpactDays: analysis.timelineImpactDays ?? 0,
      suggestedCost: analysis.suggestedCost ?? 0,
      includedFeatures: analysis.includedFeatures || [],
      outOfScopeFeatures: analysis.outOfScopeFeatures || [],
      detectedFeatures: analysis.detectedFeatures || [],
      missingRequirements: analysis.missingRequirements || [],
      reasoning: analysis.reasoning || "",
      suggestedReply: analysis.suggestedReply || "",
      priority: analysis.priority,
      status: analysis.status,
      pinned: analysis.pinned,
      bookmarked: analysis.bookmarked,
      createdAt: new Date(analysis.createdAt).toISOString().slice(0, 10),
      updatedAt: new Date(analysis.updatedAt).toISOString().slice(0, 10),
    };

    return { type: "analysis", data: analysisReport };
  });

/**
 * Generates export payload for Analytics scope.
 */
export const getAnalyticsExport = createServerFn({ method: "POST" })
  .validator((data: unknown) => exportFilterSchema.parse(data))
  .handler(async ({ data }): Promise<ExportPayload> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Project } = await import("../models/Project");
    const { Analysis } = await import("../models/Analysis");
    const user = await requireSession();
    await connectToDatabase();

    const [projects, analyses] = await Promise.all([
      Project.find({ owner: user._id }).lean(),
      Analysis.find({ owner: user._id }).sort({ createdAt: 1 }).lean(),
    ]);

    const totalAnalyses = analyses.length;
    const scopeCreepAnalyses = analyses.filter(
      (a) =>
        a.verdict === "out_of_scope" ||
        a.verdict === "confirmed_scope_creep" ||
        a.verdict === "possible_scope_creep",
    );

    const totalRevenueProtected = scopeCreepAnalyses.reduce(
      (acc, a) => acc + (a.suggestedCost ?? 0),
      0,
    );
    const totalHoursSaved = scopeCreepAnalyses.reduce(
      (acc, a) => acc + (a.additionalHours ?? 0),
      0,
    );
    const avgConfidenceScore =
      totalAnalyses > 0
        ? Math.round(analyses.reduce((acc, a) => acc + (a.confidence ?? 0), 0) / totalAnalyses)
        : 100;
    const scopeCreepRatio =
      totalAnalyses > 0 ? Math.round((scopeCreepAnalyses.length / totalAnalyses) * 100) : 0;

    const riskDistribution = {
      low: analyses.filter((a) => a.riskLevel === "low").length,
      medium: analyses.filter((a) => a.riskLevel === "medium").length,
      high: analyses.filter((a) => a.riskLevel === "high").length,
    };

    const confidenceDistribution = {
      high: analyses.filter((a) => a.confidence >= 80).length,
      medium: analyses.filter((a) => a.confidence >= 50 && a.confidence < 80).length,
      low: analyses.filter((a) => a.confidence < 50).length,
    };

    // Monthly trends aggregation
    const monthlyMap = new Map<string, { total: number; creep: number; revenue: number }>();
    analyses.forEach((a) => {
      const monthKey = new Date(a.createdAt).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      const current = monthlyMap.get(monthKey) || { total: 0, creep: 0, revenue: 0 };
      current.total += 1;
      if (
        a.verdict === "out_of_scope" ||
        a.verdict === "confirmed_scope_creep" ||
        a.verdict === "possible_scope_creep"
      ) {
        current.creep += 1;
        current.revenue += a.suggestedCost ?? 0;
      }
      monthlyMap.set(monthKey, current);
    });

    const monthlyActivity = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
      month,
      totalAnalyses: stats.total,
      scopeCreepCount: stats.creep,
      revenueProtected: stats.revenue,
    }));

    const topRiskyProjects = projects
      .map((p) => {
        const pAnalyses = analyses.filter((a) => String(a.projectId) === String(p._id));
        const creepCount = pAnalyses.filter(
          (a) => a.verdict === "out_of_scope" || a.verdict === "confirmed_scope_creep",
        ).length;
        const estCost = pAnalyses.reduce((acc, a) => acc + (a.suggestedCost ?? 0), 0);
        return {
          id: String(p._id),
          name: p.name,
          client: p.client,
          risk: p.risk,
          scopeCreepCount: creepCount,
          estimatedCostImpact: estCost,
        };
      })
      .sort((a, b) => b.estimatedCostImpact - a.estimatedCostImpact)
      .slice(0, 5);

    const analyticsReport: AnalyticsReportData = {
      meta: {
        workspaceName: user.workspaceName || `${user.firstName || "User"}'s Workspace`,
        userEmail: user.email,
        generatedAt: new Date().toISOString(),
      },
      kpis: {
        totalRevenueProtected,
        totalHoursSaved,
        avgConfidenceScore,
        totalAnalysesPerformed: totalAnalyses,
        scopeCreepRatio,
      },
      riskDistribution,
      confidenceDistribution,
      monthlyActivity,
      topRiskyProjects,
      recommendations: [
        "Enforce formal change order approvals for all High Risk flagged requests.",
        "Implement milestone budget checks for projects exceeding 70% allocated hours.",
        "Use automated client reply templates to communicate scope boundaries promptly.",
      ],
    };

    return { type: "analytics", data: analyticsReport };
  });

/**
 * Universal Bulk Export Server Function handling filtered exports.
 */
export const getBulkExport = createServerFn({ method: "POST" })
  .validator((data: unknown) => bulkExportSchema.parse(data))
  .handler(async ({ data }): Promise<ExportPayload> => {
    const { requireSession } = await import("./authorize.server");
    const { connectToDatabase } = await import("./db");
    const { Project } = await import("../models/Project");
    const { Analysis } = await import("../models/Analysis");
    const { notifyUser } = await import("./notifications.server");
    const user = await requireSession();
    await connectToDatabase();

    const { scope, targetId, filters } = data;

    let payload: ExportPayload;

    if (scope === "dashboard") {
      payload = await getDashboardExport({ data: filters });
    } else if (scope === "project" && targetId) {
      payload = await getProjectExport({ data: { id: targetId } });
    } else if (scope === "analysis" && targetId) {
      payload = await getAnalysisExport({ data: { id: targetId } });
    } else if (scope === "analytics") {
      payload = await getAnalyticsExport({ data: filters });
    } else if (scope === "projects_bulk") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = { owner: user._id };

      if (filters?.riskLevels && filters.riskLevels.length > 0) {
        query.risk = { $in: filters.riskLevels };
      }
      if (filters?.statuses && filters.statuses.length > 0) {
        query.status = { $in: filters.statuses };
      }
      if (filters?.projectIds && filters.projectIds.length > 0) {
        query._id = { $in: filters.projectIds };
      }

      const projects = await Project.find(query).sort({ updatedAt: -1 }).lean();

      const projectsData: ProjectReportData[] = projects.map((p) => ({
        id: String(p._id),
        name: p.name,
        client: p.client,
        clientInitials: p.clientInitials,
        budget: p.budget,
        hourlyRate: p.hourlyRate,
        hoursAllocated: p.hoursAllocated,
        hoursUsed: p.hoursUsed,
        progress: p.progress,
        status: p.status,
        risk: p.risk,
        contract: p.contract || "",
        scopeItems: p.scopeItems || [],
        outOfScope: p.outOfScope || [],
        createdAt: new Date(p.createdAt).toISOString().slice(0, 10),
        updatedAt: new Date(p.updatedAt).toISOString().slice(0, 10),
        analyses: [],
        summary: {
          totalAnalysesCount: 0,
          scopeCreepAnalysesCount: 0,
          totalEstimatedHours: 0,
          totalEstimatedCost: 0,
          riskScore: p.risk === "high" ? 85 : 30,
        },
      }));

      payload = { type: "projects_bulk", data: projectsData };
    } else if (scope === "analyses_bulk") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = { owner: user._id };

      if (filters?.riskLevels && filters.riskLevels.length > 0) {
        query.riskLevel = { $in: filters.riskLevels };
      }
      if (filters?.priorityLevels && filters.priorityLevels.length > 0) {
        query.priority = { $in: filters.priorityLevels };
      }
      if (filters?.statuses && filters.statuses.length > 0) {
        query.status = { $in: filters.statuses };
      }
      if (filters?.analysisIds && filters.analysisIds.length > 0) {
        query._id = { $in: filters.analysisIds };
      }
      if (filters?.projectIds && filters.projectIds.length > 0) {
        query.projectId = { $in: filters.projectIds };
      }
      if (filters?.dateRange?.startDate || filters?.dateRange?.endDate) {
        query.createdAt = {};
        if (filters.dateRange.startDate) {
          query.createdAt.$gte = new Date(filters.dateRange.startDate);
        }
        if (filters.dateRange.endDate) {
          query.createdAt.$lte = new Date(`${filters.dateRange.endDate}T23:59:59.999Z`);
        }
      }

      const [analyses, projects] = await Promise.all([
        Analysis.find(query).sort({ createdAt: -1 }).lean(),
        Project.find({ owner: user._id }).lean(),
      ]);

      const projectMap = new Map(projects.map((p) => [String(p._id), p]));

      const analysesData: AnalysisReportData[] = analyses.map((a) => {
        const proj = projectMap.get(String(a.projectId));
        return {
          id: String(a._id),
          projectId: String(a.projectId),
          projectName: proj?.name ?? "Unknown Project",
          clientName: proj?.client ?? "Unknown Client",
          originalRequirement: a.originalRequirement,
          changedRequirement: a.changedRequirement,
          aiSummary: a.aiSummary || "Scope Analysis",
          aiExplanation: a.aiExplanation,
          explanation: a.explanation || a.aiExplanation,
          verdict: a.verdict,
          confidence: a.confidence,
          riskLevel: a.riskLevel,
          additionalHours: a.additionalHours ?? 0,
          timelineImpactDays: a.timelineImpactDays ?? 0,
          suggestedCost: a.suggestedCost ?? 0,
          includedFeatures: a.includedFeatures || [],
          outOfScopeFeatures: a.outOfScopeFeatures || [],
          detectedFeatures: a.detectedFeatures || [],
          missingRequirements: a.missingRequirements || [],
          reasoning: a.reasoning || "",
          suggestedReply: a.suggestedReply || "",
          priority: a.priority,
          status: a.status,
          pinned: a.pinned,
          bookmarked: a.bookmarked,
          createdAt: new Date(a.createdAt).toISOString().slice(0, 10),
          updatedAt: new Date(a.updatedAt).toISOString().slice(0, 10),
        };
      });

      payload = { type: "analyses_bulk", data: analysesData };
    } else if (scope === "workspace") {
      const [dashPayload, analyticsPayload] = await Promise.all([
        getDashboardExport({ data: filters }),
        getAnalyticsExport({ data: filters }),
      ]);

      const workspaceData: WorkspaceExportData = {
        meta: {
          workspaceName: user.workspaceName || `${user.firstName || "User"}'s Workspace`,
          userEmail: user.email,
          generatedAt: new Date().toISOString(),
        },
        dashboard: dashPayload.data as DashboardExportData,
        projects: [],
        analyses: [],
        analytics: analyticsPayload.data as AnalyticsReportData,
      };

      payload = { type: "workspace", data: workspaceData };
    } else {
      throw new Error(`Unsupported export scope: ${scope}`);
    }

    await notifyUser({
      userId: user._id,
      title: "Export Report Generated",
      message: `Your ${scope.replace(/_/g, " ").toUpperCase()} export report was generated successfully.`,
      type: "export_completed",
      priority: "low",
      entityType: "export",
      actionUrl: `/app/notifications`,
    });

    return payload;
  });
