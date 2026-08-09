import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import { Search, Filter, ArrowUpRight, FolderOpen, Archive, CheckCircle2, LayoutGrid, Kanban } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportButton } from "@/components/export/export-button";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { listProjects } from "@/lib/projects.server";
import { formatCurrency } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { calculateProjectHealth } from "@/lib/health-calculator";
import { SmartEmptyState } from "@/components/smart-empty-state";

export const Route = createFileRoute("/app/projects/")({
  loader: async () => {
    try {
      const [activeProjects, archivedProjects] = await Promise.all([
        listProjects({ data: { archived: false } }),
        listProjects({ data: { archived: true } }),
      ]);
      return { activeProjects, archivedProjects };
    } catch {
      throw notFound();
    }
  },
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — ScopeGuard" }] }),
});

function ProjectsPage() {
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      currencySymbol?: string;
      locale?: string;
    } | null;
  };
  const currencySymbol = user?.currencySymbol || "₹";
  const locale = user?.locale || "en-IN";
  const { activeProjects, archivedProjects } = Route.useLoaderData();
  const [currentTab, setCurrentTab] = useState<"active" | "archived">("active");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "hours" | "progress">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");

  const projects = currentTab === "active" ? activeProjects : archivedProjects;

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesRisk = riskFilter === "all" || p.risk === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Sorting logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal: string | number | boolean = "";
    let bVal: string | number | boolean = "";

    if (sortBy === "hours") {
      aVal = a.hoursUsed;
      bVal = b.hoursUsed;
    } else {
      const key = sortBy === "progress" ? "progress" : sortBy === "budget" ? "budget" : "name";
      aVal = a[key];
      bVal = b[key];
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    const aNum = Number(aVal);
    const bNum = Number(bVal);
    return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
  });

  // Pagination logic
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <AppShell
      title="Projects"
      subtitle="Every engagement, one source of truth."
    >
      {/* Active vs Archived Tabs & View Mode Toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between border-b border-border gap-2">
        <div className="flex">
          <button
            onClick={() => {
              setCurrentTab("active");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-all ${
              currentTab === "active"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Active Projects ({activeProjects.length})
          </button>
          <button
            onClick={() => {
              setCurrentTab("archived");
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-all ${
              currentTab === "archived"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-4 w-4" />
            Archived Projects ({archivedProjects.length})
          </button>
        </div>

        <div className="flex items-center gap-1 pb-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 text-xs gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid View
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className="h-8 text-xs gap-1.5"
          >
            <Kanban className="h-3.5 w-3.5" /> Kanban Board
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, clients…"
            className="pl-8 bg-background/50 backdrop-blur"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="scope_creep">Scope Creep</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Risk Filter */}
        <Select
          value={riskFilter}
          onValueChange={(val) => {
            setRiskFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By Field */}
        <Select
          value={sortBy}
          onValueChange={(val: "name" | "budget" | "hours" | "progress") => {
            setSortBy(val);
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-[12px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="budget">Sort by Budget</SelectItem>
            <SelectItem value="hours">Sort by Hours</SelectItem>
            <SelectItem value="progress">Sort by Progress</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-[12px] bg-background/50 backdrop-blur"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </Button>
      </div>

      {viewMode === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Column 1: On Track */}
          <div className="panel p-4 space-y-3 bg-card/30">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> On Track (
                {sortedProjects.filter((p) => p.status === "on_track").length})
              </span>
            </div>
            {sortedProjects
              .filter((p) => p.status === "on_track")
              .map((p) => (
                <Link
                  key={p.id}
                  to="/app/projects/$id"
                  params={{ id: p.id }}
                  className="block p-3.5 rounded-xl border border-border/50 bg-background/60 hover:border-primary/50 transition-all space-y-2"
                >
                  <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{p.client}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Budget: {formatCurrency(p.budget, currencySymbol, locale)}</span>
                    <RiskChip level={p.risk} />
                  </div>
                </Link>
              ))}
          </div>

          {/* Column 2: In Progress / At Risk */}
          <div className="panel p-4 space-y-3 bg-card/30">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> At Risk / In Progress (
                {sortedProjects.filter((p) => p.status === "at_risk" || p.status === "scope_creep").length})
              </span>
            </div>
            {sortedProjects
              .filter((p) => p.status === "at_risk" || p.status === "scope_creep")
              .map((p) => (
                <Link
                  key={p.id}
                  to="/app/projects/$id"
                  params={{ id: p.id }}
                  className="block p-3.5 rounded-xl border border-border/50 bg-background/60 hover:border-primary/50 transition-all space-y-2"
                >
                  <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{p.client}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Budget: {formatCurrency(p.budget, currencySymbol, locale)}</span>
                    <RiskChip level={p.risk} />
                  </div>
                </Link>
              ))}
          </div>

          {/* Column 3: Completed */}
          <div className="panel p-4 space-y-3 bg-card/30">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Completed (
                {sortedProjects.filter((p) => p.status === "completed").length})
              </span>
            </div>
            {sortedProjects
              .filter((p) => p.status === "completed")
              .map((p) => (
                <Link
                  key={p.id}
                  to="/app/projects/$id"
                  params={{ id: p.id }}
                  className="block p-3.5 rounded-xl border border-border/50 bg-background/60 hover:border-primary/50 transition-all space-y-2"
                >
                  <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{p.client}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Budget: {formatCurrency(p.budget, currencySymbol, locale)}</span>
                    <RiskChip level={p.risk} />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      ) : paginatedProjects.length === 0 ? (
        <SmartEmptyState
          icon={FolderOpen}
          title={
            searchQuery || statusFilter !== "all" || riskFilter !== "all"
              ? "No matching projects found"
              : currentTab === "archived"
                ? "No archived projects"
                : "No active projects yet"
          }
          description={
            searchQuery || statusFilter !== "all" || riskFilter !== "all"
              ? "Try adjusting your search query, status filters, or risk level filters."
              : "Create your first project workspace to start tracking scope and contract compliance."
          }
          actionText={
            currentTab === "active" &&
            !searchQuery &&
            statusFilter === "all" &&
            riskFilter === "all"
              ? "Create project"
              : undefined
          }
          actionTo="/app/projects/new"
        />
      ) : (
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div>Project</div>
              <div>Budget</div>
              <div>Hours</div>
              <div>Health & Risk</div>
              <div>Status</div>
              <div />
            </div>
            <div className="divide-y divide-border">
              {paginatedProjects.map((p) => {
                const health = calculateProjectHealth({
                  budget: p.budget,
                  hoursAllocated: p.hoursAllocated,
                  hoursUsed: p.hoursUsed,
                  progress: p.progress,
                  status: p.status,
                  risk: p.risk,
                  scopeItemsCount: p.scopeItems?.length || 0,
                  outOfScopeCount: p.outOfScope?.length || 0,
                });

                return (
                  <Link
                    key={p.id}
                    to="/app/projects/$id"
                    params={{ id: p.id }}
                    className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5 md:grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-medium">
                        {p.clientInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium">{p.name}</div>
                        <div className="truncate text-[12px] text-muted-foreground">{p.client}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] md:contents">
                      <div className="text-[13px] tabular-nums">
                        <span className="text-muted-foreground md:hidden">Budget: </span>
                        {formatCurrency(p.budget, currencySymbol, locale)}
                      </div>
                      <div className="text-[13px] tabular-nums text-muted-foreground">
                        {p.hoursUsed}h{" "}
                        <span className="text-muted-foreground/60">/ {p.hoursAllocated}h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            health.statusColor === "emerald"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : health.statusColor === "blue"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : health.statusColor === "amber"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}
                        >
                          Health {health.healthPercent}%
                        </span>
                        <RiskChip level={p.risk} />
                      </div>
                      <div>
                        <StatusPill status={p.status} />
                      </div>
                      <ArrowUpRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-[13px]">
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages} ({filteredProjects.length} total projects)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
