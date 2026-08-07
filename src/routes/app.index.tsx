import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ShieldCheck,
  Clock,
  Mail,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { Section } from "@/components/app-shell";
import { AppShell } from "@/components/app-shell";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { ExportButton } from "@/components/export/export-button";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/projects.server";
import { listAllUserEmails } from "@/lib/emails.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";
import { listNotifications, type SerializedNotification } from "@/lib/notifications.server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/app/")({
  loader: async () => {
    console.log("[DEBUG DASHBOARD] Dashboard loader started...");
    try {
      console.log("[DEBUG DASHBOARD] Fetching projects, emails, analyses, notifications...");
      const [projects, emails, analyses, notificationsRes] = await Promise.all([
        (async () => {
          console.log("[DEBUG LOADERS] Project loader starting...");
          const res = await listProjects({ data: { archived: false } });
          console.log("[DEBUG LOADERS] Project loader done. Count:", res?.length);
          return res;
        })(),
        (async () => {
          console.log("[DEBUG LOADERS] Email loader starting...");
          const res = await listAllUserEmails();
          console.log("[DEBUG LOADERS] Email loader done. Count:", res?.length);
          return res;
        })(),
        (async () => {
          console.log("[DEBUG LOADERS] Analytics loader starting...");
          const res = await listAllUserAnalyses();
          console.log("[DEBUG LOADERS] Analytics loader done. Count:", res?.length);
          return res;
        })(),
        (async () => {
          console.log("[DEBUG LOADERS] Notification loader starting...");
          const res = (await listNotifications({ data: { limit: 5 } })) as unknown as {
            notifications: SerializedNotification[];
            totalCount: number;
            unreadCount: number;
          };
          console.log(
            "[DEBUG LOADERS] Notification loader done. Count:",
            res?.notifications?.length,
          );
          return res;
        })(),
      ]);
      console.log("[DEBUG DASHBOARD] All loaders completed successfully.");
      return { projects, emails, analyses, notifications: notificationsRes.notifications };
    } catch (err) {
      console.error("[DEBUG DASHBOARD] Error in dashboard loader:", err);
      throw err;
    }
  },
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — ScopeGuard" }] }),
});

function Dashboard() {
  console.log("[DEBUG DASHBOARD] Dashboard component rendering...");
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
      currencySymbol?: string;
      locale?: string;
    } | null;
  };
  const currencySymbol = user?.currencySymbol || "$";
  const locale = user?.locale || "en-US";
  const { projects, emails, analyses, notifications } = Route.useLoaderData();

  const greetingName = user?.firstName || user?.email?.split("@")[0] || "there";

  // Compute live KPIs from real user data (memoized for zero re-computation on render)
  const kpis = useMemo(
    () => ({
      revenueProtected: analyses.reduce(
        (sum, a) => sum + (a.verdict !== "in_scope" ? a.suggestedCost : 0),
        0,
      ),
      hoursSaved: analyses.reduce((sum, a) => sum + a.additionalHours, 0),
      emailsAnalyzed: analyses.length,
      activeAlerts: emails.filter((e) => e.risk !== "low" && !e.analyzed).length,
    }),
    [analyses, emails],
  );

  const avgConfidence = useMemo(
    () =>
      analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length)
        : 100,
    [analyses],
  );

  const scopeCreepCount = useMemo(
    () => analyses.filter((a) => a.verdict !== "in_scope").length,
    [analyses],
  );

  const highRiskProjects = useMemo(
    () => projects.filter((p) => p.risk === "high" || p.status === "scope_creep"),
    [projects],
  );

  // Build a project name map for the analyses section
  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const latestScopeChanges = useMemo(
    () =>
      analyses
        .filter(
          (a) =>
            a.verdict !== "in_scope" && a.outOfScopeFeatures && a.outOfScopeFeatures.length > 0,
        )
        .flatMap((a) =>
          a.outOfScopeFeatures.map((f) => ({
            id: a.id,
            feature: f,
            projectName: projectNameById.get(a.projectId) || "Project",
            cost: a.suggestedCost,
            hours: a.additionalHours,
            time: a.createdAt,
          })),
        )
        .slice(0, 4),
    [analyses, projectNameById],
  );

  // Total invoiced across the user's own projects, for the revenue overview panel
  const totalInvoiced = useMemo(() => projects.reduce((sum, p) => sum + p.budget, 0), [projects]);

  // 1. Dynamic Chart: Protected vs Invoiced rolling 6 months (memoized for chart performance)
  const dynamicRevenueChart = useMemo(() => {
    return Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - idx));
      const mName = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const rawMonth = d.getMonth();

      const invoiced = projects
        .filter((p) => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === rawMonth && pDate.getFullYear() === year;
        })
        .reduce((sum, p) => sum + p.budget, 0);

      const protectedAmt = analyses
        .filter((a) => {
          const aDate = new Date(a.createdAtIso);
          return (
            aDate.getMonth() === rawMonth &&
            aDate.getFullYear() === year &&
            a.verdict !== "in_scope"
          );
        })
        .reduce((sum, a) => sum + a.suggestedCost, 0);

      return {
        month: mName,
        invoiced,
        protected: protectedAmt,
      };
    });
  }, [projects, analyses]);

  const totalInvoicedInChart = useMemo(
    () => dynamicRevenueChart.reduce((sum, item) => sum + item.invoiced, 0),
    [dynamicRevenueChart],
  );
  const totalProtectedInChart = useMemo(
    () => dynamicRevenueChart.reduce((sum, item) => sum + item.protected, 0),
    [dynamicRevenueChart],
  );

  // 2. Dynamic Activity Feed from DB actions (memoized)
  const dynamicActivity = useMemo(
    () =>
      [
        ...projects.map((p) => ({
          id: `p-${p.id}`,
          type: "project" as const,
          text:
            p.status === "completed"
              ? `${p.name} marked as completed`
              : `New project created: ${p.name}`,
          meta: `${formatCurrency(p.budget, currencySymbol, locale)} budget`,
          time: p.updatedAt,
          rawDate: new Date(p.createdAt),
        })),
        ...analyses.map((a) => {
          const pName = projectNameById.get(a.projectId) ?? "Project";
          return {
            id: `a-${a.id}`,
            type: a.verdict === "in_scope" ? ("reply" as const) : ("analysis" as const),
            text:
              a.verdict === "in_scope"
                ? `Scope check cleared: ${pName}`
                : `Scope creep detected: ${pName}`,
            meta:
              a.verdict === "in_scope"
                ? "In scope"
                : `${formatCurrency(a.suggestedCost, currencySymbol, locale)} impact`,
            time: a.createdAt,
            rawDate: new Date(a.createdAtIso),
          };
        }),
      ]
        .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
        .slice(0, 5),
    [projects, analyses, projectNameById, currencySymbol, locale],
  );

  // 3. Search, Filter, Sort, Pagination states for analyses
  const [searchQuery, setSearchQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "cost" | "hours" | "confidence">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAnalyses = useMemo(
    () =>
      analyses.filter((a) => {
        const pName = projectNameById.get(a.projectId) ?? "";
        const matchesSearch =
          pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.changedRequirement.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.aiExplanation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVerdict = verdictFilter === "all" || a.verdict === verdictFilter;
        const matchesRisk = riskFilter === "all" || a.riskLevel === riskFilter;
        return matchesSearch && matchesVerdict && matchesRisk;
      }),
    [analyses, projectNameById, searchQuery, verdictFilter, riskFilter],
  );

  const sortedAnalyses = useMemo(
    () =>
      [...filteredAnalyses].sort((a, b) => {
        let aVal = 0;
        let bVal = 0;

        if (sortBy === "cost") {
          aVal = a.suggestedCost;
          bVal = b.suggestedCost;
        } else if (sortBy === "hours") {
          aVal = a.additionalHours;
          bVal = b.additionalHours;
        } else if (sortBy === "confidence") {
          aVal = a.confidence;
          bVal = b.confidence;
        } else {
          const aTime = new Date(a.createdAtIso).getTime();
          const bTime = new Date(b.createdAtIso).getTime();
          return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
        }

        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }),
    [filteredAnalyses, sortBy, sortOrder],
  );

  const itemsPerPage = 3;
  const totalPages = Math.ceil(sortedAnalyses.length / itemsPerPage);
  const paginatedAnalyses = sortedAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell
      title={`${greeting}, ${greetingName}`}
      subtitle="Here's what's happened across your workspace today."
      action={<ExportButton defaultScope="dashboard" label="Export Dashboard Report" />}
    >
      <div className="space-y-8">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue protected"
            value={kpis.revenueProtected}
            prefix={currencySymbol}
            icon={ShieldCheck}
            delta={kpis.revenueProtected > 0 ? "Blocked invoice leakage" : "No scope creep yet"}
            trend={kpis.revenueProtected > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Scope creep incidents"
            value={scopeCreepCount}
            suffix=" cases"
            icon={AlertTriangle}
            delta={`${scopeCreepCount} out-of-scope warnings`}
            trend={scopeCreepCount > 0 ? "down" : "neutral"}
          />
          <StatCard
            label="Average Confidence"
            value={avgConfidence}
            suffix="%"
            icon={Sparkles}
            delta="AI model reliability rating"
            trend="neutral"
          />
          <StatCard
            label="High Risk Projects"
            value={highRiskProjects.length}
            icon={AlertTriangle}
            delta={`${highRiskProjects.length} projects need review`}
            trend={highRiskProjects.length > 0 ? "down" : "neutral"}
          />
        </div>

        {/* AI System Health & Metrics Bar */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Gemini AI Engine: Active</span>
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
              gemini-2.5-flash
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-4 text-muted-foreground text-[12px]">
            <span>
              Total AI Analyses:{" "}
              <strong className="text-foreground font-semibold">{analyses.length}</strong>
            </span>
            <span>·</span>
            <span>
              Avg Confidence:{" "}
              <strong className="text-foreground font-semibold">{avgConfidence}%</strong>
            </span>
            <span>·</span>
            <span>
              Avg Speed:{" "}
              <strong className="text-foreground font-semibold">
                {analyses.length > 0
                  ? `${Math.round(analyses.reduce((s, a) => s + (a.processingTime || 0), 0) / analyses.length)}ms`
                  : "0ms"}
              </strong>
            </span>
            <span>·</span>
            <span className="text-[color:var(--success)] font-medium">
              ✓ Fallback Engine Online
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel p-6 bg-background/50 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium text-muted-foreground">
                  Revenue overview (rolling 6m)
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold tabular-nums">
                    {formatCurrency(totalInvoicedInChart, currencySymbol, locale)}
                  </span>
                  <span className="text-[12px] text-[color:var(--success)]">
                    +{formatCurrency(totalProtectedInChart, currencySymbol, locale)} protected
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dynamicRevenueChart}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
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
                    tickFormatter={(v: number) => formatCompactNumber(v, currencySymbol)}
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
            className="panel p-6 bg-background/50 backdrop-blur flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-medium text-muted-foreground">
                  Latest Scope Changes
                </div>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Out-of-scope features recently detected across client emails.
              </p>
            </div>

            <div className="mt-4 space-y-2 flex-1 overflow-y-auto max-h-56">
              {latestScopeChanges.length === 0 ? (
                <div className="text-center py-12 text-[12px] text-muted-foreground italic">
                  No out-of-scope feature changes logged yet.
                </div>
              ) : (
                latestScopeChanges.map((sc, idx) => (
                  <Link
                    key={idx}
                    to="/app/analysis/$id"
                    params={{ id: sc.id }}
                    className="block hover:bg-accent/30 p-2.5 rounded-lg border border-border/30 bg-accent/5 hover:border-border/60 transition-all"
                  >
                    <div className="text-[12.5px] font-medium text-foreground leading-snug">
                      {sc.feature}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[10.5px] text-muted-foreground">
                      <span>{sc.projectName}</span>
                      <span className="font-semibold text-destructive/95">
                        +{formatCurrency(sc.cost, currencySymbol, locale)} (+{sc.hours}h)
                      </span>
                    </div>
                  </Link>
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
          <div className="panel divide-y divide-border overflow-hidden bg-background/50 backdrop-blur">
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
            <div className="panel divide-y divide-border overflow-hidden bg-background/50 backdrop-blur">
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
            <div className="panel overflow-hidden bg-background/50 backdrop-blur">
              {/* Analyses Search & Filter controls */}
              <div className="p-4 border-b border-border space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search analyses..."
                    className="pl-8 h-8 text-[12px]"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Select
                    value={verdictFilter}
                    onValueChange={(val) => {
                      setVerdictFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-[11px] py-0 px-2 bg-background">
                      <SelectValue placeholder="Verdict" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Verdicts</SelectItem>
                      <SelectItem value="in_scope">In scope</SelectItem>
                      <SelectItem value="possible_scope_creep">Possible creep</SelectItem>
                      <SelectItem value="confirmed_scope_creep">Confirmed creep</SelectItem>
                      <SelectItem value="out_of_scope">Out of scope</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={riskFilter}
                    onValueChange={(val) => {
                      setRiskFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-7 text-[11px] py-0 px-2 bg-background">
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risks</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortBy}
                    onValueChange={(val: "date" | "cost" | "hours" | "confidence") => {
                      setSortBy(val);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-[11px] py-0 px-2 bg-background">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="cost">Sort by Cost</SelectItem>
                      <SelectItem value="hours">Sort by Hours</SelectItem>
                      <SelectItem value="confidence">Sort by Accuracy</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>

              {/* Paginated list */}
              <div className="divide-y divide-border">
                {paginatedAnalyses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
                    <Sparkles className="h-7 w-7 text-muted-foreground/40" />
                    <div className="text-[13px] text-muted-foreground">
                      No analyses matched the filters.
                    </div>
                  </div>
                ) : (
                  paginatedAnalyses.map((a) => {
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
                        <div className="mt-3 grid grid-cols-4 gap-2 text-[12px]">
                          <div>
                            <div className="text-muted-foreground text-[10px]">Hours</div>
                            <div className="mt-0.5 font-display text-[14px] font-semibold tabular-nums">
                              +{a.additionalHours}h
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">Timeline</div>
                            <div className="mt-0.5 font-display text-[14px] font-semibold tabular-nums">
                              +{a.timelineImpactDays}d
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">Cost</div>
                            <div className="mt-0.5 font-display text-[14px] font-semibold tabular-nums">
                              {formatCurrency(a.suggestedCost, currencySymbol, locale)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-[10px]">Accuracy</div>
                            <div className="mt-0.5 font-display text-[14px] font-semibold tabular-nums text-primary">
                              {a.confidence}%
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40 text-[12px]">
                  <span className="text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2.5"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2.5"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
