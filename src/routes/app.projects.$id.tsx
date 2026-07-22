import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  Mail,
  Sparkles,
  Download,
  Clock,
  DollarSign,
  Users,
  Check,
  X,
  Edit,
  Archive,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getProject,
  updateProject,
  deleteProject,
  archiveProject,
  restoreProject,
} from "@/lib/projects.server";
import { listEmailsForProject } from "@/lib/emails.server";
import {
  listAnalysesForProject,
  runScopeAnalysis,
  analyzeEmail,
  deleteAnalysis,
  updateAnalysis,
} from "@/lib/analyses.server";
import type { ProjectStatus, RiskLevel } from "@/models/Project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/projects/$id")({
  loader: async ({ params }) => {
    try {
      const [project, projectEmails, projectAnalyses] = await Promise.all([
        getProject({ data: { id: params.id } }),
        listEmailsForProject({ data: { projectId: params.id } }),
        listAnalysesForProject({ data: { projectId: params.id } }),
      ]);
      return { project, projectEmails, projectAnalyses };
    } catch (err) {
      if (err && typeof err === "object" && ("isRedirect" in err || "isNotFound" in err)) {
        throw err;
      }
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.project.name ?? "Project"} — ScopeGuard` }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project, projectEmails, projectAnalyses } = Route.useLoaderData();
  const nav = useNavigate();
  const router = useRouter();

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);

  // Loading States
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingEmailId, setAnalyzingEmailId] = useState<string | null>(null);

  // Manual Analysis Input
  const [originalReq, setOriginalReq] = useState(project.contract || project.scopeItems.join("\n"));
  const [changedReq, setChangedReq] = useState("");

  const analysisByEmailId = new Map(projectAnalyses.map((a) => [a.emailId, a]));

  // Actions
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    const form = new FormData(e.currentTarget);

    try {
      await updateProject({
        data: {
          id: project.id,
          name: String(form.get("name") ?? "").trim(),
          client: String(form.get("client") ?? "").trim(),
          budget: Number(form.get("budget") ?? 0),
          hourlyRate: Number(form.get("hourlyRate") ?? 0),
          hoursAllocated: Number(form.get("hoursAllocated") ?? 0),
          hoursUsed: Number(form.get("hoursUsed") ?? 0),
          progress: Number(form.get("progress") ?? 0),
          status: form.get("status") as ProjectStatus,
          risk: form.get("risk") as RiskLevel,
          contract: String(form.get("contract") ?? "").trim(),
          scopeItems: String(form.get("scopeItems") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          outOfScope: String(form.get("outOfScope") ?? "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      toast.success("Project updated successfully.");
      setIsEditOpen(false);
      router.invalidate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update project.";
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject({ data: { id: project.id } });
      toast.success("Project deleted permanently.");
      setIsDeleteOpen(false);
      nav({ to: "/app/projects" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete project.";
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      if (project.archived) {
        await restoreProject({ data: { id: project.id } });
        toast.success("Project restored successfully.");
      } else {
        await archiveProject({ data: { id: project.id } });
        toast.success("Project archived successfully.");
      }
      router.invalidate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed.";
      toast.error(msg);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleManualAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changedReq.trim()) {
      toast.error("Please enter the client's request/changed requirement.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await runScopeAnalysis({
        data: {
          projectId: project.id,
          originalRequirement: originalReq,
          changedRequirement: changedReq,
        },
      });
      toast.success("Analysis complete.");
      setIsAnalyzeOpen(false);
      setChangedReq("");
      nav({ to: "/app/analysis/$id", params: { id: analysis.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze scope.";
      toast.error(msg);
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeEmail = async (emailId: string) => {
    setAnalyzingEmailId(emailId);
    try {
      const analysis = await analyzeEmail({ data: { emailId } });
      toast.success("Email analyzed successfully.");
      router.invalidate();
      nav({ to: "/app/analysis/$id", params: { id: analysis.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to analyze email.";
      toast.error(msg);
    } finally {
      setAnalyzingEmailId(null);
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/projects">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Projects
          </Link>
        </Button>
        {project.archived && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-500 flex items-center gap-1.5 animate-pulse">
            <Archive className="h-3 w-3" /> Archived Project
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-[13px] font-semibold">
            {project.clientInitials}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{project.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>{project.client}</span>
              <span>·</span>
              <StatusPill status={project.status} />
              <span>·</span>
              <RiskChip level={project.risk} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.archived ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveToggle}
              disabled={isArchiving}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Restore Project
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchiveToggle}
                disabled={isArchiving}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
              </Button>
              <Button size="sm" onClick={() => setIsAnalyzeOpen(true)}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyze Scope
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          { icon: DollarSign, l: "Budget", v: `₹${project.budget.toLocaleString("en-IN")}` },
          {
            icon: Clock,
            l: "Hours logged",
            v: `${project.hoursUsed}h / ${project.hoursAllocated}h`,
          },
          { icon: Users, l: "Client", v: project.client },
          { icon: FileText, l: "Progress", v: `${project.progress}%` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.l} className="panel p-4 bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {s.l}
              </div>
              <div className="mt-2 font-display text-lg font-semibold tabular-nums">{s.v}</div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="emails">Emails ({projectEmails.length})</TabsTrigger>
          <TabsTrigger value="analyses">Analyses ({projectAnalyses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-6 bg-background/50 backdrop-blur">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Contract summary
              </div>
              {project.contract ? (
                <p className="mt-3 text-[14px] leading-relaxed text-foreground">
                  {project.contract}
                </p>
              ) : (
                <p className="mt-3 text-[13px] text-muted-foreground italic">
                  No contract text added yet. Click 'Edit Details' to configure.
                </p>
              )}
            </div>
            <div className="panel p-6 bg-background/50 backdrop-blur">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Project settings
              </div>
              <div className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium font-mono">${project.hourlyRate}/h</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Hours Used</span>
                  <span className="font-medium font-mono">{project.hoursUsed}h</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium font-mono">
                    ${(project.hoursUsed * project.hourlyRate).toLocaleString()} (
                    {project.budget > 0
                      ? Math.round(
                          ((project.hoursUsed * project.hourlyRate) / project.budget) * 100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-6 bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-[color:var(--success)]">
                <Check className="h-3.5 w-3.5" />
                In scope
              </div>
              {project.scopeItems.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted-foreground italic">None defined yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {project.scopeItems.map((s: string) => (
                    <li key={s} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--success)]" />
                      <span className="text-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel p-6 bg-background/50 backdrop-blur">
              <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-[color:var(--destructive)]">
                <X className="h-3.5 w-3.5" />
                Explicitly out of scope
              </div>
              {project.outOfScope.length === 0 ? (
                <p className="mt-3 text-[13px] text-muted-foreground italic">None defined yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {project.outOfScope.map((s: string) => (
                    <li key={s} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="panel p-6 bg-destructive/5 border-destructive/20 mt-8">
            <div className="text-[12px] font-medium uppercase tracking-wider text-destructive">
              Danger Zone
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[13px] font-semibold">Delete this project</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">
                  Once deleted, all related email threads and scope analyses will be erased.
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Project
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contract" className="mt-6">
          <div className="panel p-8 bg-background/50 backdrop-blur">
            <div className="mx-auto max-w-2xl space-y-6 font-serif text-[14px] leading-relaxed text-foreground">
              <h3 className="font-display text-xl font-semibold">Statement of Work</h3>
              {project.contract ? (
                <p className="whitespace-pre-line">{project.contract}</p>
              ) : (
                <p className="text-muted-foreground italic">No contract text added yet.</p>
              )}
              {project.scopeItems.length > 0 && (
                <div>
                  <h4 className="font-semibold">§3 Scope</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {project.scopeItems.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {project.outOfScope.length > 0 && (
                <div>
                  <h4 className="font-semibold">§4 Exclusions</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {project.outOfScope.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <div className="panel divide-y divide-border bg-background/50 backdrop-blur">
            {projectEmails.length === 0 && (
              <div className="p-12 text-center text-[13px] text-muted-foreground">
                No emails yet on this project.
              </div>
            )}
            {projectEmails.map((e) => {
              const analysis = analysisByEmailId.get(e.id);
              return (
                <div key={e.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium">
                      {e.fromInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-[14px] font-medium">{e.from}</div>
                          <div className="text-[12px] text-muted-foreground">{e.subject}</div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {analysis && <RiskChip level={e.risk} />}
                          <span>·</span>
                          <span>{e.receivedAt}</span>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                        {e.body}
                      </p>
                      {analysis ? (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                          <div className="flex items-center gap-2 text-[12px]">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            AI analysis ready — {analysis.confidence}% confidence
                          </div>
                          <Button size="sm" asChild>
                            <Link to="/app/analysis/$id" params={{ id: analysis.id }}>
                              View analysis →
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/40 p-3">
                          <div className="flex items-center gap-2 text-[12px]">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            Unanalyzed client message
                          </div>
                          <Button
                            size="sm"
                            disabled={analyzingEmailId === e.id}
                            onClick={() => handleAnalyzeEmail(e.id)}
                          >
                            {analyzingEmailId === e.id ? "Analyzing..." : "Analyze with AI"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analyses" className="mt-6">
          <div className="panel divide-y divide-border bg-background/50 backdrop-blur">
            {projectAnalyses.length === 0 && (
              <div className="p-12 text-center text-[13px] text-muted-foreground">
                No analyses run yet. Use the 'Analyze Scope' button to start.
              </div>
            )}
            {projectAnalyses.map((a) => (
              <div
                key={a.id}
                className="p-5 hover:bg-accent/20 transition-all relative group flex flex-col md:flex-row gap-4 justify-between"
              >
                <Link to="/app/analysis/$id" params={{ id: a.id }} className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-[13px] truncate flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      {a.emailId ? "Email Thread Scan" : "Manual Scope Scan"}
                      <span className="text-[11px] font-normal text-muted-foreground ml-2">
                        {a.createdAt}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        a.verdict === "confirmed_scope_creep" || a.verdict === "out_of_scope"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : a.verdict === "in_scope"
                            ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border border-[color:var(--success)]/20"
                            : "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20"
                      }`}
                    >
                      {a.verdict === "confirmed_scope_creep" || a.verdict === "out_of_scope"
                        ? "Confirmed Creep"
                        : a.verdict === "in_scope"
                          ? "In Scope"
                          : "Possible Creep"}
                    </span>
                  </div>
                  <div className="mt-2 text-[12.5px] text-muted-foreground line-clamp-2 pr-6">
                    {a.changedRequirement}
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] border-t border-border/40 pt-2.5">
                    <div>
                      <span className="text-muted-foreground">Confidence: </span>
                      <span className="font-semibold text-foreground">{a.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost: </span>
                      <span className="font-semibold text-foreground">${a.suggestedCost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hours: </span>
                      <span className="font-semibold text-foreground">+{a.additionalHours}h</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk: </span>
                      <span className="font-semibold text-foreground capitalize">
                        {a.riskLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority: </span>
                      <span className="font-semibold text-foreground capitalize">{a.priority}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={a.status}
                      onChange={async (e) => {
                        try {
                          await updateAnalysis({
                            data: {
                              id: a.id,
                              status: e.target.value as "active" | "pending" | "resolved",
                            },
                          });
                          toast.success("Analysis status updated.");
                          router.invalidate();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed to update status.",
                          );
                        }
                      }}
                      className="bg-accent/40 text-[11px] font-medium text-muted-foreground border border-border/50 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:text-foreground hover:bg-accent transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (confirm("Are you sure you want to delete this analysis?")) {
                        try {
                          await deleteAnalysis({ data: { id: a.id } });
                          toast.success("Analysis deleted successfully.");
                          router.invalidate();
                        } catch (err: unknown) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed to delete analysis.",
                          );
                        }
                      }
                    }}
                    className="p-1.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    title="Delete Analysis"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Details Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border">
          <form onSubmit={handleUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Project Details</DialogTitle>
              <DialogDescription>
                Modify project metadata, contract guidelines, scope lists, and rates.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[12px]">
                  Project Name
                </Label>
                <Input id="name" name="name" defaultValue={project.name} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client" className="text-[12px]">
                  Client Name
                </Label>
                <Input id="client" name="client" defaultValue={project.client} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget" className="text-[12px]">
                  Budget ($)
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min={0}
                  defaultValue={project.budget}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hourlyRate" className="text-[12px]">
                  Hourly Rate ($/h)
                </Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min={0}
                  defaultValue={project.hourlyRate}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hoursAllocated" className="text-[12px]">
                  Hours Allocated
                </Label>
                <Input
                  id="hoursAllocated"
                  name="hoursAllocated"
                  type="number"
                  min={0}
                  defaultValue={project.hoursAllocated}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hoursUsed" className="text-[12px]">
                  Hours Logged
                </Label>
                <Input
                  id="hoursUsed"
                  name="hoursUsed"
                  type="number"
                  min={0}
                  defaultValue={project.hoursUsed}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="progress" className="text-[12px]">
                  Progress (%)
                </Label>
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={project.progress}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-[12px]">
                  Status
                </Label>
                <Select name="status" defaultValue={project.status}>
                  <SelectTrigger className="text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="scope_creep">Scope Creep</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="risk" className="text-[12px]">
                  Risk Level
                </Label>
                <Select name="risk" defaultValue={project.risk}>
                  <SelectTrigger className="text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contract" className="text-[12px]">
                Contract SOW Text
              </Label>
              <Textarea id="contract" name="contract" rows={3} defaultValue={project.contract} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scopeItems" className="text-[12px]">
                In Scope Items (One per line)
              </Label>
              <Textarea
                id="scopeItems"
                name="scopeItems"
                rows={3}
                defaultValue={project.scopeItems.join("\n")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="outOfScope" className="text-[12px]">
                Explicit Exclusions (One per line)
              </Label>
              <Textarea
                id="outOfScope"
                name="outOfScope"
                rows={3}
                defaultValue={project.outOfScope.join("\n")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete Project?
            </DialogTitle>
            <DialogDescription>
              This is a permanent action. All metadata, contract, uploaded file records, scope
              details, and analyses related to this project will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Scope Analysis Dialog */}
      <Dialog open={isAnalyzeOpen} onOpenChange={setIsAnalyzeOpen}>
        <DialogContent className="max-w-xl bg-background border border-border">
          <form onSubmit={handleManualAnalysis} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Analyze Custom Scope Request
              </DialogTitle>
              <DialogDescription>
                Compare custom deliverables or changes directly against the contracted Statement of
                Work.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="originalReq" className="text-[12.5px] font-semibold text-foreground">
                Original Contract Scope (Baseline)
              </Label>
              <Textarea
                id="originalReq"
                value={originalReq}
                onChange={(e) => setOriginalReq(e.target.value)}
                rows={3}
                required
                className="bg-accent/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="changedReq" className="text-[12.5px] font-semibold text-foreground">
                Changed / New Requirement (Client Ask)
              </Label>
              <Textarea
                id="changedReq"
                value={changedReq}
                onChange={(e) => setChangedReq(e.target.value)}
                placeholder="Can we add an iOS app to launch with inventory synchronization?"
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAnalyzeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? "Analyzing..." : "Compare & Analyze"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
