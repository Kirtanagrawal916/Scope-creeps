import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ShieldCheck, Clock, FolderKanban, TrendingUp, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/projects.server";
import { listAllUserEmails } from "@/lib/emails.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";

export const Route = createFileRoute("/app/analytics")({
  loader: async () => {
    const [projects, emails, analyses] = await Promise.all([
      listProjects(),
      listAllUserEmails(),
      listAllUserAnalyses(),
    ]);
    return { projects, emails, analyses };
  },
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — ScopeGuard" }] }),
});

function Analytics() {
  const { projects, emails, analyses } = Route.useLoaderData();

  // Compute live KPIs from database
  const revenueProtected = analyses.reduce(
    (sum, a) => sum + (a.verdict !== "in_scope" ? a.suggestedCost : 0),
    0,
  );
  const hoursReclaimed = analyses.reduce((sum, a) => sum + a.additionalHours, 0);
  const projectsCount = projects.length;
  const avgAccuracy =
    analyses.length > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length)
      : 0;

  // 1. Dynamic Risk Distribution based on projects' risk levels
  const totalProjects = projects.length;
  const lowCount = projects.filter((p) => p.risk === "low").length;
  const mediumCount = projects.filter((p) => p.risk === "medium").length;
  const highCount = projects.filter((p) => p.risk === "high").length;

  const dynamicRiskDistribution =
    totalProjects > 0
      ? [
          {
            name: "In scope",
            value: Math.round((lowCount / totalProjects) * 100),
            color: "var(--success)",
          },
          {
            name: "Minor scope creep",
            value: Math.round((mediumCount / totalProjects) * 100),
            color: "var(--warning)",
          },
          {
            name: "Major scope creep",
            value: Math.round((highCount / totalProjects) * 100),
            color: "var(--destructive)",
          },
        ]
      : [
          { name: "In scope", value: 0, color: "var(--success)" },
          { name: "Minor scope creep", value: 0, color: "var(--warning)" },
          { name: "Major scope creep", value: 0, color: "var(--destructive)" },
        ];

  // 2. Revenue Chart (rolling last 6 months) — built entirely from the user's own data
  const dynamicRevenueChart = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const mName = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const rawMonth = d.getMonth();

    // Sum user's project budgets created in this specific month/year
    const userInvoiced = projects
      .filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === rawMonth && pDate.getFullYear() === year;
      })
      .reduce((sum, p) => sum + p.budget, 0);

    // Sum user's suggested costs created in this specific month/year
    const userProtected = analyses
      .filter((a) => {
        const aDate = new Date(a.createdAtIso);
        return (
          aDate.getMonth() === rawMonth && aDate.getFullYear() === year && a.verdict !== "in_scope"
        );
      })
      .reduce((sum, a) => sum + a.suggestedCost, 0);

    return {
      month: mName,
      invoiced: userInvoiced,
      protected: userProtected,
    };
  });

  // 3. Scope Trend (rolling last 8 weeks) — built entirely from the user's own data
  const dynamicScopeTrend = Array.from({ length: 8 }).map((_, idx) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - idx) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const userCreeps = analyses.filter((a) => {
      const aDate = new Date(a.createdAtIso);
      return aDate >= weekStart && aDate < weekEnd && a.verdict !== "in_scope";
    }).length;

    return {
      week: `W${idx + 1}`,
      detected: userCreeps,
    };
  });

  // 4. Confidence Score Distribution
  const bin95 = analyses.filter((a) => a.confidence >= 95).length;
  const bin90 = analyses.filter((a) => a.confidence >= 90 && a.confidence < 95).length;
  const bin80 = analyses.filter((a) => a.confidence >= 80 && a.confidence < 90).length;
  const binUnder80 = analyses.filter((a) => a.confidence < 80).length;

  const confidenceChartData = [
    { name: "95-100% (High)", value: bin95, color: "var(--success)" },
    { name: "90-94% (Good)", value: bin90, color: "var(--primary)" },
    { name: "80-89% (Medium)", value: bin80, color: "var(--warning)" },
    { name: "<80% (Low)", value: binUnder80, color: "var(--destructive)" },
  ].filter((b) => b.value > 0);

  // 5. Monthly Workspace Growth (last 6 months)
  const monthlyGrowthChart = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const mName = d.toLocaleString("default", { month: "short" });
    const year = d.getFullYear();
    const rawMonth = d.getMonth();

    const newProjects = projects.filter((p) => {
      const pDate = new Date(p.createdAt);
      return pDate.getMonth() === rawMonth && pDate.getFullYear() === year;
    }).length;

    const ranAnalyses = analyses.filter((a) => {
      const aDate = new Date(a.createdAt);
      return aDate.getMonth() === rawMonth && aDate.getFullYear() === year;
    }).length;

    return {
      month: mName,
      projects: newProjects,
      scans: ranAnalyses,
    };
  });

  return (
    <AppShell
      title="Analytics"
      subtitle="How much your discipline is actually worth."
      action={
        <Button variant="outline" size="sm">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard
            label="Revenue protected"
            value={revenueProtected}
            prefix="₹"
            icon={ShieldCheck}
            delta={revenueProtected > 0 ? "from scope creep blocked" : "No creep blocked yet"}
            trend={revenueProtected > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Hours reclaimed"
            value={hoursReclaimed}
            suffix="h"
            icon={Clock}
            delta={hoursReclaimed > 0 ? "saved on projects" : "Track email to save"}
            trend={hoursReclaimed > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Projects analyzed"
            value={projectsCount}
            icon={FolderKanban}
            delta={projectsCount > 0 ? `${projectsCount} active` : "Create project to start"}
            trend="neutral"
          />
          <StatCard
            label="Avg. accuracy"
            value={avgAccuracy}
            suffix="%"
            icon={TrendingUp}
            delta={analyses.length > 0 ? `across ${analyses.length} scans` : "No scans yet"}
            trend={avgAccuracy > 0 ? "up" : "neutral"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Revenue protected vs. invoiced
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dynamicRevenueChart}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
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
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="invoiced"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="protected"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fill="url(#g2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Risk distribution
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicRiskDistribution}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {dynamicRiskDistribution.map((r, i) => (
                      <Cell key={i} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {dynamicRiskDistribution.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                    <span className="text-foreground">{r.name}</span>
                  </div>
                  <span className="tabular-nums text-muted-foreground">{r.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Scope creep detected (last 8 weeks)
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dynamicScopeTrend}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--accent)" }}
                  />
                  <Bar dataKey="detected" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Confidence score distribution
            </div>
            {confidenceChartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-[12px] text-muted-foreground italic">
                No analyses scanned yet.
              </div>
            ) : (
              <>
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={confidenceChartData}
                        dataKey="value"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        stroke="var(--background)"
                        strokeWidth={2}
                      >
                        {confidenceChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {confidenceChartData.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-[11px] bg-accent/20 px-2.5 py-1 rounded border border-border/30"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: c.color }}
                        />
                        <span className="text-foreground truncate">{c.name}</span>
                      </div>
                      <span className="font-semibold text-muted-foreground ml-1">{c.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Workspace growth & scan activity (last 6 months)
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyGrowthChart}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
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
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="projects"
                  name="New Projects"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="scans"
                  name="AI Scans Ran"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
