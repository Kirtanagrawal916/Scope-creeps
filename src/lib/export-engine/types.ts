/**
 * export-engine/types.ts — Core type definitions for Export Reports Module.
 */

export type ExportFormat = "pdf" | "csv" | "excel" | "json" | "docx" | "zip";

export type ExportScope =
  | "dashboard"
  | "project"
  | "projects_bulk"
  | "analysis"
  | "analyses_bulk"
  | "analytics"
  | "workspace";

export interface ExportDateRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface ExportFilterOptions {
  riskLevels?: ("low" | "medium" | "high")[];
  priorityLevels?: ("low" | "medium" | "high")[];
  statuses?: string[];
  projectIds?: string[];
  analysisIds?: string[];
  dateRange?: ExportDateRange;
  searchQuery?: string;
}

export interface ExportRequestOptions {
  scope: ExportScope;
  format: ExportFormat;
  targetId?: string; // Single project or analysis ID if applicable
  filters?: ExportFilterOptions;
}

// ---------------------------------------------------------------------------
// Data Payloads
// ---------------------------------------------------------------------------

export interface WorkspaceExportMeta {
  workspaceName: string;
  userEmail: string;
  generatedAt: string;
}

export interface DashboardExportData {
  meta: WorkspaceExportMeta;
  stats: {
    totalProjects: number;
    totalAnalyses: number;
    scopeCreepCount: number;
    revenueProtected: number;
    hoursSaved: number;
    avgConfidence: number;
    highRiskProjectsCount: number;
  };
  highRiskProjects: Array<{
    id: string;
    name: string;
    client: string;
    budget: number;
    hoursUsed: number;
    hoursAllocated: number;
    risk: string;
    status: string;
  }>;
  recentScopeChanges: Array<{
    id: string;
    projectName: string;
    originalRequirement: string;
    changedRequirement: string;
    verdict: string;
    riskLevel: string;
    additionalHours: number;
    suggestedCost: number;
    createdAt: string;
  }>;
}

export interface ProjectReportData {
  id: string;
  name: string;
  client: string;
  clientInitials: string;
  budget: number;
  hourlyRate: number;
  hoursAllocated: number;
  hoursUsed: number;
  progress: number;
  status: string;
  risk: string;
  contract: string;
  scopeItems: string[];
  outOfScope: string[];
  createdAt: string;
  updatedAt: string;
  analyses: Array<{
    id: string;
    originalRequirement: string;
    changedRequirement: string;
    aiSummary: string;
    explanation: string;
    verdict: string;
    confidence: number;
    riskLevel: string;
    additionalHours: number;
    suggestedCost: number;
    priority: string;
    status: string;
    suggestedReply: string;
    createdAt: string;
  }>;
  summary: {
    totalAnalysesCount: number;
    scopeCreepAnalysesCount: number;
    totalEstimatedHours: number;
    totalEstimatedCost: number;
    riskScore: number;
  };
}

export interface AnalysisReportData {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  emailId?: string;
  emailSubject?: string;
  emailSender?: string;
  originalRequirement: string;
  changedRequirement: string;
  aiSummary: string;
  aiExplanation: string;
  explanation: string;
  verdict: string;
  confidence: number;
  riskLevel: string;
  additionalHours: number;
  timelineImpactDays: number;
  suggestedCost: number;
  includedFeatures: string[];
  outOfScopeFeatures: string[];
  detectedFeatures: string[];
  missingRequirements: string[];
  reasoning: string;
  suggestedReply: string;
  priority: string;
  status: string;
  pinned: boolean;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsReportData {
  meta: WorkspaceExportMeta;
  kpis: {
    totalRevenueProtected: number;
    totalHoursSaved: number;
    avgConfidenceScore: number;
    totalAnalysesPerformed: number;
    scopeCreepRatio: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  monthlyActivity: Array<{
    month: string;
    totalAnalyses: number;
    scopeCreepCount: number;
    revenueProtected: number;
  }>;
  topRiskyProjects: Array<{
    id: string;
    name: string;
    client: string;
    risk: string;
    scopeCreepCount: number;
    estimatedCostImpact: number;
  }>;
  recommendations: string[];
}

export interface WorkspaceExportData {
  meta: WorkspaceExportMeta;
  dashboard: DashboardExportData;
  projects: ProjectReportData[];
  analyses: AnalysisReportData[];
  analytics: AnalyticsReportData;
}

export type ExportPayload =
  | { type: "dashboard"; data: DashboardExportData }
  | { type: "project"; data: ProjectReportData }
  | { type: "projects_bulk"; data: ProjectReportData[] }
  | { type: "analysis"; data: AnalysisReportData }
  | { type: "analyses_bulk"; data: AnalysisReportData[] }
  | { type: "analytics"; data: AnalyticsReportData }
  | { type: "workspace"; data: WorkspaceExportData };
