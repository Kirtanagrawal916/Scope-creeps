import { createFileRoute } from "@tanstack/react-router";
import { Network, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getApiMetricsFromBackend } from "@/lib/api-metrics.server";

export const Route = createFileRoute("/app/admin/api-metrics")({
  loader: async () => {
    const result = await getApiMetricsFromBackend();
    return { result };
  },
  component: ApiMetricsPage,
  head: () => ({ meta: [{ title: "API Metrics — Admin — ScopeGuard" }] }),
});

function ApiMetricsPage() {
  const { result } = Route.useLoaderData();

  return (
    <AppShell
      title="API Metrics"
      subtitle="Per-endpoint request activity on the Gmail/AI Express backend."
    >
      {!result.available ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
          <AlertTriangle className="h-9 w-9 text-[color:var(--destructive)]" strokeWidth={1.5} />
          <div className="text-[15px] font-medium">Express backend unreachable</div>
          <p className="max-w-md text-[13px] text-muted-foreground">{result.error}</p>
          <p className="max-w-md text-[12px] text-muted-foreground/70">
            Attempted: <code>{result.sourceUrl}</code>. Make sure the feat/gmail-ai-intelligence
            server is running and <code>EXPRESS_API_URL</code> is set correctly in this app&apos;s{" "}
            <code>.env</code>.
          </p>
        </div>
      ) : result.metrics.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
          <Network className="h-9 w-9 text-muted-foreground/40" />
          <div className="text-[15px] font-medium">No requests recorded yet</div>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Metrics reset whenever the Express server restarts. Make a few requests against it (e.g.{" "}
            <code>GET /api/health</code>) and refresh this page.
          </p>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
            <div>Endpoint</div>
            <div>Requests</div>
            <div>Success</div>
            <div>Errors</div>
            <div>Avg. Latency</div>
          </div>
          <div className="divide-y divide-border">
            {result.metrics.map((m) => (
              <div
                key={m.endpoint}
                className="flex flex-col gap-2 px-4 py-3.5 sm:px-5 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:items-center md:gap-4"
              >
                <div className="truncate font-mono text-[12.5px] text-foreground">{m.endpoint}</div>
                <div className="text-[13px] tabular-nums text-foreground">{m.requestCount}</div>
                <div className="text-[13px] tabular-nums text-[color:var(--success)]">
                  {m.successCount}
                </div>
                <div className="text-[13px] tabular-nums text-[color:var(--destructive)]">
                  {m.errorCount}
                </div>
                <div className="text-[13px] tabular-nums text-muted-foreground">
                  {m.averageLatencyMs} ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
