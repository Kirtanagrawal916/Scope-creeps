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
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AppShell, Section } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
// Chart data and activity feed remain from mock-data until analytics aggregation
// is implemented in a future phase.
import { activity, revenueChart } from "@/lib/mock-data";
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
                  <span className="font-display text-2xl font-semibold tabular-nums">₹205,000</span>
                  <span className="text-[12px] text-[color:var(--success)]">
                    +₹43k protected in Jan
                  </span>
                </div>
              </div>
              <div className="flex gap-1 rounded-lg border border-border bg-background/40 p-0.5 text-[11px]">
                {["7d", "30d", "90d", "12m"].map((t, i) => (
                  <button
                    key={t}
                    className={`rounded-md px-2 py-1 ${
                      i === 3 ? "bg-accent text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gInvoiced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gProtected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="invoiced"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#gInvoiced)"
                  />
                  <Area
                    type="monotone"
                    dataKey="protected"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fill="url(#gProtected)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
              {activity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent">
                    {a.type === "analysis" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                    {a.type === "email" && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
                    {a.type === "reply" && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-[color:var(--success)]" />
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
              ))}
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
