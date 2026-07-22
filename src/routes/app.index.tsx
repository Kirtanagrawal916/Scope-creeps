import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Mail,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  FileText,
  Plus,
} from "lucide-react";
import { AppShell, Section } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/projects.server";
import { listAllUserEmails } from "@/lib/emails.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";

export const Route = createFileRoute("/app/")({
  loader: async () => {
    // All three server fns enforce { owner: user._id } — IDOR prevented
    const [projects, emails, analyses] = await Promise.all([
      listProjects(),
      listAllUserEmails(),
      listAllUserAnalyses(),
    ]);
    return { projects, emails, analyses };
  },
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — ScopeGuard" }] }),
});

function Dashboard() {
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
    } | null;
  };
  const { projects, emails, analyses } = Route.useLoaderData();

  const greetingName = user?.firstName || user?.email?.split("@")[0] || "there";

  // Compute live KPIs from real user data
  const kpis = {
    revenueProtected: analyses.reduce(
      (sum, a) => sum + (a.verdict !== "in_scope" ? a.suggestedCost : 0),
      0,
    ),
    hoursSaved: analyses.reduce((sum, a) => sum + a.additionalHours, 0),
    emailsAnalyzed: analyses.length,
    activeAlerts: emails.filter((e) => e.risk !== "low" && !e.analyzed).length,
  };

  // Build a project name map for the analyses section
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  // Build a real activity feed from the user's own projects, emails, and analyses.
  // Each list is already sorted most-recent-first by its server query, so we take
  // the top items from each (using their own pre-formatted relative time strings)
  // rather than re-parsing them into Date objects.
  type ActivityItem = {
    id: string;
    type: "analysis" | "email" | "project";
    text: string;
    meta: string;
    time: string;
  };
  const activity: ActivityItem[] = [
    ...analyses.slice(0, 3).map((a) => ({
      id: `analysis-${a.id}`,
      type: "analysis" as const,
      text:
        a.verdict === "out_of_scope"
          ? `Scope creep detected on ${projectNameById.get(a.projectId) ?? "a project"}`
          : `Analysis completed on ${projectNameById.get(a.projectId) ?? "a project"}`,
      meta: `₹${(a.suggestedCost / 1000).toFixed(1)}k impact`,
      time: a.createdAt,
    })),
    ...emails.slice(0, 3).map((e) => ({
      id: `email-${e.id}`,
      type: "email" as const,
      text: `New client email from ${e.from}`,
      meta: projectNameById.get(e.projectId) ?? "Unknown project",
      time: e.receivedAt,
    })),
    ...projects
      .filter((p) => p.status === "completed")
      .slice(0, 2)
      .map((p) => ({
        id: `project-${p.id}`,
        type: "project" as const,
        text: `${p.name} marked as completed`,
        meta: `₹${(p.budget / 1000).toFixed(1)}k final`,
        time: p.updatedAt,
      })),
  ].slice(0, 5);

  // Total invoiced across the user's own projects, for the revenue overview panel
  const totalInvoiced = projects.reduce((sum, p) => sum + p.budget, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell
      title={`${greeting}, ${greetingName}`}
      subtitle="Here's what's happened across your workspace today."
    >
      <div className="space-y-8">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue protected"
            value={kpis.revenueProtected}
            prefix="₹"
            icon={ShieldCheck}
            delta={kpis.revenueProtected > 0 ? "from scope creep blocked" : "No scope creep yet"}
            trend={kpis.revenueProtected > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Hours saved"
            value={kpis.hoursSaved}
            suffix="h"
            icon={Clock}
            delta={
              kpis.hoursSaved > 0 ? "from flagged out-of-scope work" : "Track your first email"
            }
            trend={kpis.hoursSaved > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Emails analyzed"
            value={kpis.emailsAnalyzed}
            icon={Mail}
            delta={
              kpis.emailsAnalyzed > 0
                ? `${projects.length} project${projects.length !== 1 ? "s" : ""} monitored`
                : "Connect an email to start"
            }
            trend="neutral"
          />
          <StatCard
            label="Active scope alerts"
            value={kpis.activeAlerts}
            icon={AlertTriangle}
            delta={kpis.activeAlerts > 0 ? `${kpis.activeAlerts} need review` : "All clear"}
            trend={kpis.activeAlerts > 0 ? "down" : "neutral"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium text-muted-foreground">
                  Revenue overview
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    ₹{totalInvoiced.toLocaleString()}
                  </span>
                  {kpis.revenueProtected > 0 ? (
                    <span className="text-[12px] text-[color:var(--success)]">
                      +₹{(kpis.revenueProtected / 1000).toFixed(1)}k protected total
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground">
                      No scope creep blocked yet
                    </span>
                  )}
                </div>
              </div>
            </div>
            {projects.length === 0 ? (
              <div className="mt-6 flex h-64 flex-col items-center justify-center gap-2 text-center">
                <div className="text-[13px] text-muted-foreground">
                  No revenue data yet — create your first project to start tracking it
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>Total invoiced</span>
                    <span>₹{totalInvoiced.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-accent">
                    <div className="h-full w-full rounded-full bg-primary" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>Revenue protected from scope creep</span>
                    <span>₹{kpis.revenueProtected.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-[color:var(--success)]"
                      style={{
                        width: `${
                          totalInvoiced > 0
                            ? Math.min(100, (kpis.revenueProtected / totalInvoiced) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel p-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium text-muted-foreground">Activity</div>
              <Link
                to="/app/notifications"
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="text-[13px] text-muted-foreground">No activity yet</div>
                </div>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                      {a.type === "analysis" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                      {a.type === "email" && (
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {a.type === "project" && (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] leading-snug text-foreground">{a.text}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.meta} · {a.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <Section
          title="Recent projects"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/projects">View all →</Link>
            </Button>
          }
        >
          <div className="panel divide-y divide-border overflow-hidden">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                <div className="text-[13px] text-muted-foreground">No projects yet</div>
                <Button size="sm" asChild>
                  <Link to="/app/projects/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create your first project
                  </Link>
                </Button>
              </div>
            ) : (
              projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/app/projects/$id"
                  params={{ id: p.id }}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[11px] font-medium">
                    {p.clientInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-foreground">{p.name}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {p.client} · updated {p.updatedAt}
                    </div>
                  </div>
                  <div className="hidden w-40 md:block">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {p.hoursUsed}h / {p.hoursAllocated}h
                      </span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))
            )}
          </div>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Recent emails">
            <div className="panel divide-y divide-border overflow-hidden">
              {emails.length === 0 ? (
                <div className="flex items-center justify-center px-5 py-12 text-[13px] text-muted-foreground">
                  No emails yet
                </div>
              ) : (
                emails.slice(0, 4).map((e) => (
                  <Link
                    key={e.id}
                    to="/app/projects/$id"
                    params={{ id: e.projectId }}
                    className="block px-5 py-4 hover:bg-accent/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium">
                        {e.fromInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-medium">{e.from}</span>
                          <span className="text-[11px] text-muted-foreground">{e.receivedAt}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[13px] text-foreground">
                          {e.subject}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {e.preview}
                        </div>
                      </div>
                      {e.unread && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Section>

          <Section title="Latest AI analyses">
            <div className="panel divide-y divide-border overflow-hidden">
              {analyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground/40" />
                  <div className="text-[13px] text-muted-foreground">No analyses yet</div>
                </div>
              ) : (
                analyses.slice(0, 3).map((a) => {
                  const projectName = projectNameById.get(a.projectId) ?? "Unknown project";
                  return (
                    <Link
                      key={a.id}
                      to="/app/analysis/$id"
                      params={{ id: a.id }}
                      className="block px-5 py-4 hover:bg-accent/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[13px] font-medium">{projectName}</div>
                        <span className="rounded-full bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--destructive)]">
                          {a.verdict === "out_of_scope"
                            ? "Out of scope"
                            : a.verdict === "in_scope"
                              ? "In scope"
                              : "Mixed"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                        <div>
                          <div className="text-muted-foreground">Hours</div>
                          <div className="mt-0.5 font-display text-[15px] font-semibold tabular-nums">
                            +{a.additionalHours}h
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Timeline</div>
                          <div className="mt-0.5 font-display text-[15px] font-semibold tabular-nums">
                            +{a.timelineImpactDays}d
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Cost</div>
                          <div className="mt-0.5 font-display text-[15px] font-semibold tabular-nums">
                            ₹{(a.suggestedCost / 1000).toFixed(1)}k
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
              <div className="flex items-center justify-center px-5 py-8">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/projects/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Analyze a new email
                  </Link>
                </Button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
