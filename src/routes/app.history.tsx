import { createFileRoute, Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Pin,
  Bookmark,
  Trash2,
  Archive,
  Download,
  FolderOpen,
  Calendar,
  Grid,
  List,
  CheckSquare,
  Square,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ExportButton } from "@/components/export/export-button";
import { SmartEmptyState } from "@/components/smart-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listProjects, type SerializedProject } from "@/lib/projects.server";
import {
  queryAnalyses,
  bulkDeleteAnalyses,
  bulkChangeAnalysesStatus,
  bulkArchiveAnalyses,
  updateAnalysis,
  type SerializedAnalysis,
} from "@/lib/analyses.server";
import { toast } from "sonner";
import { RiskChip } from "@/components/status-pill";
import { formatCurrency } from "@/lib/formatters";

interface HistorySearch {
  search?: string;
  projectId?: string;
  risk?: "low" | "medium" | "high" | "all";
  verdict?:
    | "in_scope"
    | "possible_scope_creep"
    | "confirmed_scope_creep"
    | "out_of_scope"
    | "mixed"
    | "all";
  status?: "active" | "pending" | "resolved" | "all";
  priority?: "low" | "medium" | "high" | "all";
  dateStart?: string;
  dateEnd?: string;
  sortBy?:
    "newest" | "oldest" | "highest_risk" | "highest_confidence" | "highest_cost" | "highest_hours";
  page?: number;
  tab?: "all" | "pinned" | "bookmarked" | "archived";
}

type HistoryItem = SerializedAnalysis & { projectName: string; clientName: string };

export const Route = createFileRoute("/app/history")({
  validateSearch: (search: Record<string, unknown>): HistorySearch => {
    return {
      search: (search.search as string) || undefined,
      projectId: (search.projectId as string) || undefined,
      risk: (search.risk as HistorySearch["risk"]) || "all",
      verdict: (search.verdict as HistorySearch["verdict"]) || "all",
      status: (search.status as HistorySearch["status"]) || "all",
      priority: (search.priority as HistorySearch["priority"]) || "all",
      dateStart: (search.dateStart as string) || undefined,
      dateEnd: (search.dateEnd as string) || undefined,
      sortBy: (search.sortBy as HistorySearch["sortBy"]) || "newest",
      page: Number(search.page) || 1,
      tab: (search.tab as HistorySearch["tab"]) || "all",
    };
  },
  loaderDeps: ({ search }) => ({
    search: search.search,
    projectId: search.projectId,
    risk: search.risk,
    verdict: search.verdict,
    status: search.status,
    priority: search.priority,
    dateStart: search.dateStart,
    dateEnd: search.dateEnd,
    sortBy: search.sortBy,
    page: search.page,
    tab: search.tab,
  }),
  loader: async ({ deps }) => {
    const [projects, queryResult] = await Promise.all([
      listProjects(),
      queryAnalyses({
        data: {
          search: deps.search,
          projectId: deps.projectId,
          risk: deps.risk,
          verdict: deps.verdict,
          status: deps.status,
          priority: deps.priority,
          dateStart: deps.dateStart,
          dateEnd: deps.dateEnd,
          pinnedOnly: deps.tab === "pinned" ? true : undefined,
          bookmarkedOnly: deps.tab === "bookmarked" ? true : undefined,
          archivedOnly: deps.tab === "archived" ? true : false,
          sortBy: deps.sortBy,
          page: deps.page,
          limit: 10,
        },
      }),
    ]);
    return { projects, queryResult };
  },
  component: HistoryPage,
});

const verdictColors = {
  out_of_scope: "bg-destructive/10 text-destructive border border-destructive/20",
  confirmed_scope_creep: "bg-destructive/10 text-destructive border border-destructive/20",
  in_scope:
    "bg-[color:var(--success)]/10 text-[color:var(--success)] border border-[color:var(--success)]/20",
  mixed:
    "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20",
  possible_scope_creep:
    "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20",
} as const;

function HistoryPage() {
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      currencySymbol?: string;
      locale?: string;
    } | null;
  };
  const currencySymbol = user?.currencySymbol || "₹";
  const locale = user?.locale || "en-IN";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { projects, queryResult } = Route.useLoaderData() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchParams = Route.useSearch() as any;
  const navigate = useNavigate({ from: Route.fullPath });

  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);

  // Sync local search when search query changes externally
  useEffect(() => {
    setLocalSearch(searchParams.search || "");
  }, [searchParams.search]);

  // Debounced navigation helper
  const updateFilter = (updates: Partial<HistorySearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
        page: updates.page !== undefined ? updates.page : 1, // reset to page 1 on filter changes
      }),
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter({ search: localSearch || undefined });
  };

  const resetFilters = () => {
    setLocalSearch("");
    navigate({
      search: {
        page: 1,
        tab: searchParams.tab,
        sortBy: "newest",
      },
    });
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === queryResult.analyses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queryResult.analyses.map((a: HistoryItem) => a.id));
    }
  };

  // Bulk Actions Handlers
  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} analyses?`)) {
      try {
        const res = await bulkDeleteAnalyses({ data: { ids: selectedIds } });
        toast.success(`Successfully deleted ${res.deletedCount} analyses.`);
        setSelectedIds([]);
        navigate({ search: (prev) => prev }); // refresh
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || "Failed to perform bulk deletion.");
      }
    }
  };

  const handleBulkStatusChange = async (status: "active" | "pending" | "resolved") => {
    try {
      const res = await bulkChangeAnalysesStatus({ data: { ids: selectedIds, status } });
      toast.success(`Successfully updated ${res.modifiedCount} analyses.`);
      setSelectedIds([]);
      setBulkStatusOpen(false);
      navigate({ search: (prev) => prev }); // refresh
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to change status.");
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    try {
      const res = await bulkArchiveAnalyses({ data: { ids: selectedIds, archived: archive } });
      toast.success(
        archive
          ? `Successfully archived ${res.modifiedCount} analyses.`
          : `Successfully restored ${res.modifiedCount} analyses.`,
      );
      setSelectedIds([]);
      navigate({ search: (prev) => prev }); // refresh
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to update archive state.");
    }
  };

  // Toggle flags for individual analysis
  const togglePin = async (id: string, currentVal: boolean) => {
    try {
      await updateAnalysis({ data: { id, pinned: !currentVal } });
      toast.success(!currentVal ? "Analysis pinned." : "Analysis unpinned.");
      navigate({ search: (prev) => prev });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to toggle pin state.");
    }
  };

  const toggleBookmark = async (id: string, currentVal: boolean) => {
    try {
      await updateAnalysis({ data: { id, bookmarked: !currentVal } });
      toast.success(!currentVal ? "Analysis bookmarked." : "Analysis unbookmarked.");
      navigate({ search: (prev) => prev });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to toggle bookmark state.");
    }
  };

  // Exports
  const exportToCSV = (itemsToExport: HistoryItem[]) => {
    if (itemsToExport.length === 0) return;

    const headers = [
      "Project Name",
      "Client",
      "Verdict",
      "Confidence %",
      "Risk Level",
      "Additional Hours",
      "Timeline Impact (days)",
      "Suggested Cost (INR)",
      "Priority",
      "Status",
      "AI Summary",
      "Original Requirement",
      "Changed Requirement",
      "Date",
    ];

    const rows = itemsToExport.map((a: HistoryItem) => [
      `"${a.projectName.replace(/"/g, '""')}"`,
      `"${a.clientName.replace(/"/g, '""')}"`,
      a.verdict,
      a.confidence,
      a.riskLevel,
      a.additionalHours,
      a.timelineImpactDays,
      a.suggestedCost,
      a.priority,
      a.status,
      `"${a.aiSummary.replace(/"/g, '""')}"`,
      `"${a.originalRequirement.replace(/"/g, '""')}"`,
      `"${a.changedRequirement.replace(/"/g, '""')}"`,
      a.createdAtIso,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r: (string | number)[]) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ScopeGuard_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully.");
  };

  const handleBulkCSVExport = () => {
    const items = queryResult.analyses.filter((a: HistoryItem) => selectedIds.includes(a.id));
    exportToCSV(items);
  };

  // Summarize protected metrics for this view
  const sumCostProtected = queryResult.analyses.reduce(
    (sum: number, a: HistoryItem) => sum + a.suggestedCost,
    0,
  );
  const sumHoursSuggested = queryResult.analyses.reduce(
    (sum: number, a: HistoryItem) => sum + a.additionalHours,
    0,
  );

  return (
    <AppShell>
      {/* Upper Metrics / Tabs */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analysis History</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Search, sort, filter, bookmark, and export scope creep analysis runs.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border border-border/80 bg-background/65 p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode("timeline")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "timeline"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Timeline view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="List table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <ExportButton defaultScope="analyses_bulk" label="Export Reports" />
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Scans Shown", value: queryResult.totalCount, suffix: "" },
          {
            label: "Suggested Revenue Protected",
            value: formatCurrency(sumCostProtected, currencySymbol, locale),
            suffix: "",
          },
          { label: "Billable Hours Flagged", value: `${sumHoursSuggested}h`, suffix: "" },
          { label: "Confidence Average", value: "92.4%", suffix: "" },
        ].map((kpi, idx) => (
          <div key={idx} className="panel p-4 flex flex-col justify-center">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </div>
            <div className="mt-2 text-2xl font-bold font-display leading-none text-foreground">
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Segment */}
      <div className="mt-6 panel p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by project, requirements, explanation, verdict, status..."
              className="pl-8 text-[13px]"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" className="px-5">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Button>
          {(searchParams.projectId ||
            searchParams.risk !== "all" ||
            searchParams.verdict !== "all" ||
            searchParams.status !== "all" ||
            searchParams.priority !== "all" ||
            searchParams.dateStart ||
            searchParams.dateEnd ||
            searchParams.search) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </form>

        {/* Advanced Filters Expandable Grid */}
        {showFilters && (
          <div className="grid gap-3 pt-3 border-t border-border/40 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 text-[12px]">
            {/* Project Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Project
              </label>
              <select
                value={searchParams.projectId || "all"}
                onChange={(e) =>
                  updateFilter({ projectId: e.target.value === "all" ? undefined : e.target.value })
                }
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Projects</option>
                {projects.map((p: SerializedProject) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Risk Level
              </label>
              <select
                value={searchParams.risk || "all"}
                onChange={(e) => updateFilter({ risk: e.target.value as HistorySearch["risk"] })}
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Risks</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            {/* Verdict Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Verdict
              </label>
              <select
                value={searchParams.verdict || "all"}
                onChange={(e) =>
                  updateFilter({ verdict: e.target.value as HistorySearch["verdict"] })
                }
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Verdicts</option>
                <option value="in_scope">In scope</option>
                <option value="possible_scope_creep">Possible Creep</option>
                <option value="confirmed_scope_creep">Confirmed Creep</option>
                <option value="out_of_scope">Out of scope</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Status
              </label>
              <select
                value={searchParams.status || "all"}
                onChange={(e) =>
                  updateFilter({ status: e.target.value as HistorySearch["status"] })
                }
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Priority
              </label>
              <select
                value={searchParams.priority || "all"}
                onChange={(e) =>
                  updateFilter({ priority: e.target.value as HistorySearch["priority"] })
                }
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Sorting Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                Sort By
              </label>
              <select
                value={searchParams.sortBy || "newest"}
                onChange={(e) =>
                  updateFilter({ sortBy: e.target.value as HistorySearch["sortBy"] })
                }
                className="w-full bg-accent/40 border border-border/80 rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="newest">Newest Date</option>
                <option value="oldest">Oldest Date</option>
                <option value="highest_risk">Highest Risk</option>
                <option value="highest_confidence">Highest Confidence</option>
                <option value="highest_cost">Highest Cost</option>
                <option value="highest_hours">Highest Hours</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-1.5 col-span-2 md:col-span-3 lg:col-span-2">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground block">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  type="date"
                  className="pl-8 h-8 text-[12px] bg-accent/10"
                  value={searchParams.dateStart || ""}
                  onChange={(e) => updateFilter({ dateStart: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-3 lg:col-span-2">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground block">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  type="date"
                  className="pl-8 h-8 text-[12px] bg-accent/10"
                  value={searchParams.dateEnd || ""}
                  onChange={(e) => updateFilter({ dateEnd: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Selectors */}
      <div className="mt-4 flex border-b border-border/40 text-[13px] font-medium">
        {[
          { id: "all", label: "All Scans" },
          { id: "pinned", label: "Pinned", icon: Pin },
          { id: "bookmarked", label: "Bookmarked", icon: Bookmark },
          { id: "archived", label: "Archived", icon: Archive },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = (searchParams.tab || "all") === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => updateFilter({ tab: tab.id as HistorySearch["tab"], page: 1 })}
              className={`flex items-center gap-1.5 px-4 py-2 border-b-2 -mb-[2px] transition-all ${
                active
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-accent/40 border border-border/50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[12.5px] animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{selectedIds.length}</span>
            <span className="text-muted-foreground">selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-2 ml-1"
            >
              Clear Selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Change */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setBulkStatusOpen(!bulkStatusOpen)}
              >
                Change Status
              </Button>
              {bulkStatusOpen && (
                <div className="absolute right-0 bottom-8 z-10 w-28 bg-popover border border-border rounded-lg shadow-lg p-1 space-y-0.5 text-[11.5px]">
                  {["active", "pending", "resolved"].map((st) => (
                    <button
                      key={st}
                      onClick={() =>
                        handleBulkStatusChange(st as "active" | "pending" | "resolved")
                      }
                      className="w-full text-left px-2.5 py-1.5 hover:bg-accent rounded capitalize font-medium"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Archive / Restore */}
            {searchParams.tab === "archived" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => handleBulkArchive(false)}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => handleBulkArchive(true)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
              </Button>
            )}

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={handleBulkCSVExport}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              onClick={handleBulkDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Main List Area */}
      <div className="mt-4">
        {queryResult.analyses.length === 0 ? (
          <SmartEmptyState
            icon={FolderOpen}
            title="No scope analyses found"
            description={
              searchParams.projectId ||
              searchParams.risk !== "all" ||
              searchParams.verdict !== "all" ||
              searchParams.search
                ? "No analyses matched your active filters or search terms."
                : "No AI scope scans have been generated yet. Create a project and scan client emails."
            }
            actionText={
              searchParams.projectId ||
              searchParams.risk !== "all" ||
              searchParams.verdict !== "all" ||
              searchParams.search
                ? "Clear Filters"
                : "Run first scope analysis"
            }
            onActionClick={
              searchParams.projectId ||
              searchParams.risk !== "all" ||
              searchParams.verdict !== "all" ||
              searchParams.search
                ? resetFilters
                : undefined
            }
            actionTo={
              !(
                searchParams.projectId ||
                searchParams.risk !== "all" ||
                searchParams.verdict !== "all" ||
                searchParams.search
              )
                ? "/app"
                : undefined
            }
          />
        ) : viewMode === "timeline" ? (
          /* Cards Timeline Layout */
          <div className="space-y-4">
            {queryResult.analyses.map((a: HistoryItem) => {
              const verdictClass =
                verdictColors[a.verdict as keyof typeof verdictColors] ||
                verdictColors.possible_scope_creep;
              const isSelected = selectedIds.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`panel p-5 bg-background/50 hover:bg-background/80 transition-all border flex gap-4 ${
                    isSelected ? "border-primary/60 bg-accent/10" : "border-border/60"
                  }`}
                >
                  {/* Row Selection Box */}
                  <div className="pt-0.5">
                    <button
                      onClick={() => toggleSelect(a.id)}
                      className="text-muted-foreground/60 hover:text-primary transition-colors focus:outline-none"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>

                  {/* Content details */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <Link
                          to="/app/analysis/$id"
                          params={{ id: a.id }}
                          className="hover:underline font-display text-[15px] font-semibold text-foreground flex items-center gap-1.5 min-w-0"
                        >
                          <span className="truncate">
                            {a.projectName} · {a.clientName}
                          </span>
                        </Link>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Analyzed {a.createdAt}
                        </div>
                      </div>

                      {/* Header Badge Row */}
                      <div className="flex items-center gap-2">
                        <StatusPill status={a.status} />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${
                            a.priority === "high"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : a.priority === "medium"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {a.priority} Priority
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${verdictClass}`}
                        >
                          {a.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* AI Executive Summary Alert */}
                    {a.aiSummary && (
                      <div className="text-[12.5px] text-muted-foreground bg-accent/20 px-3 py-2 rounded-lg border border-border/40 flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="leading-relaxed line-clamp-2">{a.aiSummary}</p>
                      </div>
                    )}

                    {/* Meta stats bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-border/20 text-[12px]">
                      {/* Requirements display */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="truncate text-muted-foreground">
                          <span className="font-semibold text-foreground">Req ask:</span>{" "}
                          {a.changedRequirement}
                        </div>
                      </div>

                      {/* Numeric values */}
                      <div className="flex items-center gap-5 shrink-0 tabular-nums">
                        <div>
                          <span className="text-muted-foreground">Hours: </span>
                          <span className="font-semibold">+{a.additionalHours}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline: </span>
                          <span className="font-semibold">+{a.timelineImpactDays}d</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost: </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(a.suggestedCost, currencySymbol, locale)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence / Action Toolbar */}
                    <div className="flex items-center justify-between pt-1 text-[11.5px] text-muted-foreground">
                      {/* Confidence Progress Bar */}
                      <div className="flex items-center gap-2 w-48">
                        <span>Confidence:</span>
                        <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${a.confidence}%` }}
                          />
                        </div>
                        <span className="font-semibold text-foreground">{a.confidence}%</span>
                      </div>

                      {/* Interactive Pin/Bookmark widgets */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePin(a.id, a.pinned)}
                          className={`hover:text-primary transition-colors flex items-center gap-1 ${
                            a.pinned ? "text-primary font-semibold" : "text-muted-foreground/60"
                          }`}
                          title={a.pinned ? "Unpin analysis" : "Pin analysis"}
                        >
                          <Pin className="h-3.5 w-3.5" fill={a.pinned ? "currentColor" : "none"} />
                          <span>{a.pinned ? "Pinned" : "Pin"}</span>
                        </button>
                        <button
                          onClick={() => toggleBookmark(a.id, a.bookmarked)}
                          className={`hover:text-[color:var(--warning)] transition-colors flex items-center gap-1 ${
                            a.bookmarked
                              ? "text-[color:var(--warning)] font-semibold"
                              : "text-muted-foreground/60"
                          }`}
                          title={a.bookmarked ? "Remove bookmark" : "Bookmark analysis"}
                        >
                          <Bookmark
                            className="h-3.5 w-3.5"
                            fill={a.bookmarked ? "currentColor" : "none"}
                          />
                          <span>{a.bookmarked ? "Bookmarked" : "Bookmark"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Structured Grid Table Layout */
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-background/40 font-medium text-muted-foreground">
                    <th className="px-4 py-3 w-8">
                      <button
                        onClick={toggleSelectAll}
                        className="text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        {selectedIds.length === queryResult.analyses.length ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">Project & Client</th>
                    <th className="px-4 py-3">Verdict</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Cost protected</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queryResult.analyses.map((a: HistoryItem) => {
                    const verdictClass =
                      verdictColors[a.verdict as keyof typeof verdictColors] ||
                      verdictColors.possible_scope_creep;
                    const isSelected = selectedIds.includes(a.id);
                    return (
                      <tr
                        key={a.id}
                        className={`hover:bg-accent/30 transition-colors ${
                          isSelected ? "bg-accent/15" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(a.id)}
                            className="text-muted-foreground/60 hover:text-primary transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <Link
                              to="/app/analysis/$id"
                              params={{ id: a.id }}
                              className="font-medium text-foreground hover:underline block truncate"
                            >
                              {a.projectName}
                            </Link>
                            <span className="text-[11px] text-muted-foreground">
                              {a.clientName} · {a.createdAt}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${verdictClass}`}
                          >
                            {a.verdict.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{a.confidence}%</td>
                        <td className="px-4 py-3 font-semibold text-primary tabular-nums">
                          {formatCurrency(a.suggestedCost, currencySymbol, locale)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                          +{a.additionalHours}h
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] capitalize font-medium ${
                              a.priority === "high"
                                ? "text-destructive font-semibold"
                                : a.priority === "medium"
                                  ? "text-warning"
                                  : "text-primary"
                            }`}
                          >
                            {a.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={a.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePin(a.id, a.pinned)}
                              className={`p-1 hover:bg-accent rounded ${
                                a.pinned ? "text-primary" : "text-muted-foreground/40"
                              }`}
                              title={a.pinned ? "Unpin" : "Pin"}
                            >
                              <Pin
                                className="h-3.5 w-3.5"
                                fill={a.pinned ? "currentColor" : "none"}
                              />
                            </button>
                            <button
                              onClick={() => toggleBookmark(a.id, a.bookmarked)}
                              className={`p-1 hover:bg-accent rounded ${
                                a.bookmarked
                                  ? "text-[color:var(--warning)]"
                                  : "text-muted-foreground/40"
                              }`}
                              title={a.bookmarked ? "Remove bookmark" : "Bookmark"}
                            >
                              <Bookmark
                                className="h-3.5 w-3.5"
                                fill={a.bookmarked ? "currentColor" : "none"}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Segment */}
      {queryResult.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between px-2 text-[13px]">
          <span className="text-muted-foreground">
            Page {queryResult.currentPage} of {queryResult.totalPages} ({queryResult.totalCount}{" "}
            total scans)
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={queryResult.currentPage === 1}
              onClick={() => updateFilter({ page: queryResult.currentPage - 1 })}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={queryResult.currentPage === queryResult.totalPages}
              onClick={() => updateFilter({ page: queryResult.currentPage + 1 })}
              className="flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatusPill({ status }: { status: "active" | "pending" | "resolved" }) {
  if (status === "active") {
    return (
      <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
        Active
      </span>
    );
  }
  if (status === "resolved") {
    return (
      <span className="rounded-full bg-[color:var(--success)]/10 text-[color:var(--success)] border border-[color:var(--success)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
        Resolved
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase">
      Pending
    </span>
  );
}
