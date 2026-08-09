import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, XCircle, Timer, Coins } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { getAiUsageMetrics } from "@/lib/ai-usage.server";

export const Route = createFileRoute("/app/admin/ai-usage")({
  loader: async () => {
    const metrics = await getAiUsageMetrics();
    return { metrics };
  },
  component: AiUsagePage,
  head: () => ({ meta: [{ title: "AI Usage — Admin — ScopeGuard" }] }),
});

function AiUsagePage() {
  const { metrics } = Route.useLoaderData();

  return (
    <AppShell
      title="AI Usage"
      subtitle="Gemini scope-analysis activity, read from stored analysis results."
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total requests" value={metrics.totalRequests} icon={Sparkles} />
          <StatCard
            label="Successful (Gemini)"
            value={metrics.successfulRequests}
            icon={CheckCircle2}
          />
          <StatCard
            label="Failed (fell back to rules)"
            value={metrics.failedRequests}
            icon={XCircle}
          />
          <StatCard
            label="Avg. response time"
            value={metrics.averageResponseTimeMs ?? 0}
            suffix=" ms"
            icon={Timer}
          />
          <StatCard label="Total tokens used" value={metrics.totalTokensUsed} icon={Coins} />
        </div>

        <div className="panel p-5">
          <div className="text-[12px] font-medium text-muted-foreground">Success rate</div>
          <div className="mt-2 font-display text-[24px] font-semibold tracking-tight text-foreground">
            {metrics.successRate === null ? "N/A — no requests yet" : `${metrics.successRate}%`}
          </div>
          <p className="mt-2 max-w-xl text-[12px] text-muted-foreground">
            &quot;Successful&quot; means Gemini returned a valid response. &quot;Failed&quot; means
            the Gemini call errored and the request transparently fell back to the rule-based engine
            (still returned a result to the user, but wasn&apos;t AI-generated). Average tokens per
            request:{" "}
            {metrics.averageTokensPerRequest === null ? "N/A" : metrics.averageTokensPerRequest}.
          </p>
        </div>

        <div className="panel border-dashed p-5">
          <div className="text-[12px] font-medium text-muted-foreground">Not tracked yet</div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            The project does not currently record AI calls that crash before an Analysis document is
            saved, so a true end-to-end failure rate isn&apos;t available — the figures above are
            calculated only from analyses that were persisted.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
