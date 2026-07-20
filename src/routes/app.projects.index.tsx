import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Search, Filter, ArrowUpRight, FolderOpen, Archive, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { listProjects } from "@/lib/projects.server";
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
  const { activeProjects, archivedProjects } = Route.useLoaderData();
  const [currentTab, setCurrentTab] = useState<"active" | "archived">("active");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "hours" | "progress">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

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
    <AppShell title="Projects" subtitle="Every engagement, one source of truth.">
      {/* Active vs Archived Tabs */}
      <div className="mb-6 flex border-b border-border">
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

      {paginatedProjects.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-[15px] font-medium">No projects found</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            {searchQuery || statusFilter !== "all" || riskFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Create your first project and upload a contract to start tracking scope."}
          </p>
          {!searchQuery &&
            statusFilter === "all" &&
            riskFilter === "all" &&
            currentTab === "active" && (
              <Button size="sm" asChild>
                <Link to="/app/projects/new">New project</Link>
              </Button>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div>Project</div>
              <div>Budget</div>
              <div>Hours</div>
              <div>Risk</div>
              <div>Status</div>
              <div />
            </div>
            <div className="divide-y divide-border">
              {paginatedProjects.map((p) => (
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
                      <span className="text-muted-foreground md:hidden">Budget: </span>₹
                      {p.budget.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[13px] tabular-nums text-muted-foreground">
                      {p.hoursUsed}h{" "}
                      <span className="text-muted-foreground/60">/ {p.hoursAllocated}h</span>
                    </div>
                    <div>
                      <RiskChip level={p.risk} />
                    </div>
                    <div>
                      <StatusPill status={p.status} />
                    </div>
                    <ArrowUpRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                  </div>
                </Link>
              ))}
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
