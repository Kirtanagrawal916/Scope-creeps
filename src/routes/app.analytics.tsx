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
import { revenueChart, riskDistribution, scopeTrend } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — ScopeGuard" }] }),
});

function Analytics() {
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
          <StatCard label="Revenue protected" value={148200} prefix="$" icon={ShieldCheck} delta="+18.2%" trend="up" />
          <StatCard label="Hours reclaimed" value={312} suffix="h" icon={Clock} delta="+42h" trend="up" />
          <StatCard label="Projects analyzed" value={24} icon={FolderKanban} delta="+3 this month" trend="up" />
          <StatCard label="Avg. accuracy" value={94} suffix="%" icon={TrendingUp} delta="+2pts" trend="up" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel p-6">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Revenue protected vs. invoiced
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
                  <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v/1000}k`} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="invoiced" stroke="var(--primary)" strokeWidth={2} fill="url(#g1)" />
                  <Area type="monotone" dataKey="protected" stroke="var(--success)" strokeWidth={2} fill="url(#g2)" />
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
                  <Pie data={riskDistribution} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="var(--background)" strokeWidth={2}>
                    {riskDistribution.map((r, i) => (
                      <Cell key={i} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {riskDistribution.map((r) => (
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

        <div className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            Scope creep detected (last 8 weeks)
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopeTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "var(--accent)" }} />
                <Bar dataKey="detected" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
