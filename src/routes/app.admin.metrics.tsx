import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Mail, Sparkles, Bell, BellRing } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { getSystemMetrics } from "@/lib/system-metrics.server";

export const Route = createFileRoute("/app/admin/metrics")({
  loader: async () => {
    const metrics = await getSystemMetrics();
    return { metrics };
  },
  component: SystemMetricsPage,
  head: () => ({ meta: [{ title: "System Metrics — Admin — ScopeGuard" }] }),
});

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function SystemMetricsPage() {
  const { metrics } = Route.useLoaderData();
  const dbConnected = metrics.database.status === "connected";

  return (
    <AppShell title="System Metrics" subtitle="Workspace-wide project health, at a glance.">
      <div className="space-y-6">
        {/* Usage counts */}
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total users" value={metrics.totalUsers} icon={Users} />
          <StatCard label="Active users" value={metrics.activeUsers} icon={UserCheck} />
          <StatCard label="Emails processed" value={metrics.totalEmailsProcessed} icon={Mail} />
          <StatCard label="AI requests" value={metrics.totalAiRequests} icon={Sparkles} />
          <StatCard label="Notifications" value={metrics.totalNotifications} icon={Bell} />
          <StatCard
            label="Unread notifications"
            value={metrics.unreadNotifications}
            icon={BellRing}
          />
        </div>

        {/* Server / DB health — not numeric counters, so plain panels rather than StatCard */}
        <div>
          <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Server health</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="panel p-5">
              <div className="text-[12px] font-medium text-muted-foreground">Database</div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    dbConnected ? "bg-[color:var(--success)]" : "bg-[color:var(--destructive)]"
                  }`}
                />
                <span className="font-display text-[20px] font-semibold capitalize tracking-tight text-foreground">
                  {metrics.database.status}
                </span>
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[12px] font-medium text-muted-foreground">Server uptime</div>
              <div className="mt-3 font-display text-[20px] font-semibold tracking-tight text-foreground">
                {formatUptime(metrics.server.uptimeSeconds)}
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[12px] font-medium text-muted-foreground">Memory usage</div>
              <div className="mt-3 font-display text-[20px] font-semibold tracking-tight text-foreground">
                {metrics.server.memory.heapUsedMb} MB
                <span className="ml-1 text-[13px] font-normal text-muted-foreground">
                  / {metrics.server.memory.heapTotalMb} MB heap
                </span>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {metrics.server.memory.rssMb} MB RSS
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[12px] font-medium text-muted-foreground">CPU load (1 min)</div>
              <div className="mt-3 font-display text-[20px] font-semibold tracking-tight text-foreground">
                {metrics.server.loadAverage1m === null
                  ? "N/A"
                  : metrics.server.loadAverage1m.toFixed(2)}
              </div>
              {metrics.server.loadAverage1m === null && (
                <div className="mt-1 text-[12px] text-muted-foreground">
                  Not available on this platform
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
