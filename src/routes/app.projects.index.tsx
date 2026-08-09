import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import {
  Search,
  ArrowUpRight,
  FolderOpen,
  Archive,
  CheckCircle2,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportButton } from "@/components/export/export-button";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { listProjects, updateProject, type SerializedProject } from "@/lib/projects.server";
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
import { useState, useEffect } from "react";
import { calculateProjectHealth } from "@/lib/health-calculator";
import { SmartEmptyState } from "@/components/smart-empty-state";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { ProjectStatus } from "@/models/Project";

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

const KANBAN_COLUMNS: Array<{ id: ProjectStatus; label: string; color: string }> = [
  { id: "on_track", label: "On Track", color: "bg-emerald-500" },
  { id: "at_risk", label: "At Risk", color: "bg-amber-500" },
  { id: "scope_creep", label: "Scope Creep", color: "bg-rose-500" },
  { id: "completed", label: "Completed", color: "bg-indigo-500" },
];

function ProjectsPage() {
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      currencySymbol?: string;
      locale?: string;
    } | null;
  };
  const currencySymbol = user?.currencySymbol || "₹";
  const locale = user?.locale || "en-IN";
  const { activeProjects: initialActive, archivedProjects: initialArchived } =
    Route.useLoaderData();
  const [currentTab, setCurrentTab] = useState<"active" | "archived">("active");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const [activeProjects, setActiveProjects] = useState<SerializedProject[]>(initialActive);
  const [archivedProjects, setArchivedProjects] = useState<SerializedProject[]>(initialArchived);

  useEffect(() => {
    setActiveProjects(initialActive);
    setArchivedProjects(initialArchived);
  }, [initialActive, initialArchived]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "hours" | "progress">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const projects = currentTab === "active" ? activeProjects : archivedProjects;
  const setProjects = currentTab === "active" ? setActiveProjects : setArchivedProjects;

  // Sensors for dnd-kit with 8px pointer activation constraint to allow natural clicks on project cards
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

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

  // Pagination logic for Table View
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const projectId = String(active.id);
    const destinationStatus = String(over.id) as ProjectStatus;

    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject || targetProject.status === destinationStatus) return;

    const previousStatus = targetProject.status;

    // 1. Optimistic Update
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: destinationStatus } : p)),
    );

    const formattedStatus = destinationStatus.replace("_", " ");
    toast.success(`Project "${targetProject.name}" moved to ${formattedStatus}`);

    // 2. Persist to server
    try {
      await updateProject({
        data: {
          id: projectId,
          status: destinationStatus,
        },
      });
    } catch {
      // 3. Rollback on failure
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: previousStatus } : p)),
      );
      toast.error(`Failed to update project status. Reverted changes.`);
    }
  };

  const activeDragProject = activeDragId ? projects.find((p) => p.id === activeDragId) : null;

  return (
    <AppShell
      title="Projects"
      subtitle="Every engagement, one source of truth."
      action={<ExportButton defaultScope="projects_bulk" label="Export Projects Report" />}
    >
      {/* Active vs Archived Tabs & View Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border">
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

        {/* View Switcher: Kanban vs Table */}
        <div className="flex items-center gap-1 pb-2">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban Board
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setViewMode("table")}
          >
            <List className="h-3.5 w-3.5" />
            Table View
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

      {sortedProjects.length === 0 ? (
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
      ) : viewMode === "kanban" ? (
        /* Kanban Board View with @dnd-kit */
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map((col) => {
              const colProjects = sortedProjects.filter((p) => p.status === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.label}
                  color={col.color}
                  count={colProjects.length}
                >
                  {colProjects.map((p) => (
                    <DraggableProjectCard
                      key={p.id}
                      project={p}
                      currencySymbol={currencySymbol}
                      locale={locale}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>

          {/* Drag Overlay during active drag */}
          <DragOverlay>
            {activeDragProject ? (
              <ProjectCardPreview
                project={activeDragProject}
                currencySymbol={currencySymbol}
                locale={locale}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* Table View */
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

          {/* Pagination Controls for Table View */}
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

// ---------------------------------------------------------------------------
// Subcomponents for Kanban Board
// ---------------------------------------------------------------------------

function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: {
  id: ProjectStatus;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border p-4 backdrop-blur-xl transition-all min-h-[420px] ${
        isOver
          ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20 shadow-md"
          : "border-border/80 bg-card/60"
      }`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </span>
        </div>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3 flex-1">{children}</div>
    </div>
  );
}

function DraggableProjectCard({
  project,
  currencySymbol,
  locale,
}: {
  project: SerializedProject;
  currencySymbol: string;
  locale: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const health = calculateProjectHealth({
    budget: project.budget,
    hoursAllocated: project.hoursAllocated,
    hoursUsed: project.hoursUsed,
    progress: project.progress,
    status: project.status,
    risk: project.risk,
    scopeItemsCount: project.scopeItems?.length || 0,
    outOfScopeCount: project.outOfScope?.length || 0,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/80 p-3.5 shadow-2xs backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30 border-dashed border-primary" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-medium">
              {project.clientInitials}
            </div>
            <div className="min-w-0">
              <Link
                to="/app/projects/$id"
                params={{ id: project.id }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors block truncate"
              >
                {project.name}
              </Link>
              <p className="text-[10px] text-muted-foreground truncate">{project.client}</p>
            </div>
          </div>
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-border/40">
          <span className="font-semibold text-foreground">
            {formatCurrency(project.budget, currencySymbol, locale)}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
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
            <RiskChip level={project.risk} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCardPreview({
  project,
  currencySymbol,
  locale,
}: {
  project: SerializedProject;
  currencySymbol: string;
  locale: string;
}) {
  const health = calculateProjectHealth({
    budget: project.budget,
    hoursAllocated: project.hoursAllocated,
    hoursUsed: project.hoursUsed,
    progress: project.progress,
    status: project.status,
    risk: project.risk,
    scopeItemsCount: project.scopeItems?.length || 0,
    outOfScopeCount: project.outOfScope?.length || 0,
  });

  return (
    <div className="rounded-xl border border-primary/50 bg-card p-3.5 shadow-2xl backdrop-blur-md rotate-2 scale-[1.03] cursor-grabbing w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[10px] font-medium">
            {project.clientInitials}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground block truncate">
              {project.name}
            </span>
            <p className="text-[10px] text-muted-foreground truncate">{project.client}</p>
          </div>
        </div>
        <GripVertical className="h-3.5 w-3.5 text-primary" />
      </div>

      <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-border/40">
        <span className="font-semibold text-foreground">
          {formatCurrency(project.budget, currencySymbol, locale)}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
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
          <RiskChip level={project.risk} />
        </div>
      </div>
    </div>
  );
}
