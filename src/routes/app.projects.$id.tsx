import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProject } from "@/lib/projects.server";
import { listEmailsForProject } from "@/lib/emails.server";
import { listAnalysesForProject } from "@/lib/analyses.server";

export const Route = createFileRoute("/app/projects/$id")({
  loader: async ({ params }) => {
    try {
      // All three calls include owner verification internally — IDOR prevented
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

  // Map emailId → analysis for the emails tab
  const analysisByEmailId = new Map(projectAnalyses.map((a) => [a.emailId, a]));

  return (
    <AppShell>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link to="/app/projects">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Projects
        </Link>
      </Button>

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm">Analyze new email</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          { icon: DollarSign, l: "Budget", v: `₹${project.budget.toLocaleString("en-IN")}` },
          {
            icon: Clock,
            l: "Hours",
            v: `${project.hoursUsed}h / ${project.hoursAllocated}h`,
          },
          { icon: Users, l: "Client", v: project.client },
          { icon: FileText, l: "Progress", v: `${project.progress}%` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.l} className="panel p-4">
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
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-6">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Contract summary
              </div>
              {project.contract ? (
                <p className="mt-3 text-[14px] leading-relaxed text-foreground">
                  {project.contract}
                </p>
              ) : (
                <p className="mt-3 text-[13px] text-muted-foreground italic">
                  No contract text added yet.
                </p>
              )}
            </div>
            <div className="panel p-6">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Uploaded files
              </div>
              <div className="mt-3 space-y-2">
                {["SOW-v3.pdf", "Timeline.xlsx", "Brand-guidelines.pdf"].map((f) => (
                  <div
                    key={f}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-[13px]"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {f}
                    </div>
                    <button className="text-[11px] text-muted-foreground hover:text-foreground">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel p-6">
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
            <div className="panel p-6">
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
        </TabsContent>

        <TabsContent value="contract" className="mt-6">
          <div className="panel p-8">
            <div className="mx-auto max-w-2xl space-y-6 font-serif text-[14px] leading-relaxed text-foreground">
              <h3 className="font-display text-xl font-semibold">Statement of Work</h3>
              {project.contract ? (
                <p>{project.contract}</p>
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
          <div className="panel divide-y divide-border">
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
                      {analysis && (
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="panel p-6">
            <div className="space-y-5">
              {[
                { t: "Analysis flagged as out of scope", m: "2h ago" },
                { t: "New email from client", m: "2h ago" },
                { t: "Hours logged: 4h", m: "1d ago" },
                {
                  t: "Project created",
                  m: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—",
                },
              ].map((a) => (
                <div key={a.t} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
                  <div className="flex-1 text-[13px]">
                    <div className="text-foreground">{a.t}</div>
                    <div className="text-[11px] text-muted-foreground">{a.m}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
