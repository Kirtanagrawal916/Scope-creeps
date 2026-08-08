import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  DollarSign,
  Sparkles,
  Copy,
  CheckCheck,
  Pin,
  Bookmark,
  Printer,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExportButton } from "@/components/export/export-button";
import { RiskChip, StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { getAnalysisDetails, updateAnalysis, runScopeAnalysis } from "@/lib/analyses.server";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/analysis/$id")({
  loader: async ({ params }) => {
    try {
      return await getAnalysisDetails({ data: { id: params.id } });
    } catch (err) {
      if (err && typeof err === "object" && ("isRedirect" in err || "isNotFound" in err)) {
        throw err;
      }
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Analysis — ${loaderData?.email?.subject ?? "ScopeGuard"}` }],
  }),
  component: AnalysisPage,
});

const verdictConfig = {
  out_of_scope: {
    icon: ShieldX,
    color: "var(--destructive)",
    label: "Out of scope",
    bg: "bg-destructive/10 text-destructive border border-destructive/20",
  },
  in_scope: {
    icon: ShieldCheck,
    color: "var(--success)",
    label: "In scope",
    bg: "bg-[color:var(--success)]/10 text-[color:var(--success)] border border-[color:var(--success)]/20",
  },
  mixed: {
    icon: ShieldAlert,
    color: "var(--warning)",
    label: "Mixed / Partial",
    bg: "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20",
  },
  possible_scope_creep: {
    icon: ShieldAlert,
    color: "var(--warning)",
    label: "Possible Creep",
    bg: "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border border-[color:var(--warning)]/20",
  },
  confirmed_scope_creep: {
    icon: ShieldX,
    color: "var(--destructive)",
    label: "Confirmed Creep",
    bg: "bg-destructive/10 text-destructive border border-destructive/20",
  },
} as const;

function AnalysisPage() {
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      currencySymbol?: string;
      locale?: string;
    } | null;
  };
  const currencySymbol = user?.currencySymbol || "$";
  const locale = user?.locale || "en-US";
  const { analysis, project, email } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate({ from: Route.fullPath });
  const [isPinning, setIsPinning] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const verdict = verdictConfig[analysis.verdict] || verdictConfig.possible_scope_creep;
  const VerdictIcon = verdict.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      toast.info("Running fresh Gemini AI analysis...");
      const newAnalysis = await runScopeAnalysis({
        data: {
          projectId: project.id,
          originalRequirement: analysis.originalRequirement || "Agreed deliverables list",
          changedRequirement: analysis.changedRequirement,
        },
      });
      toast.success("AI Analysis regenerated successfully.");
      navigate({ to: "/app/analysis/$id", params: { id: newAnalysis.id } });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to regenerate AI analysis.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsPinning(true);
      await updateAnalysis({ data: { id: analysis.id, pinned: !analysis.pinned } });
      toast.success(!analysis.pinned ? "Analysis pinned." : "Analysis unpinned.");
      navigate({ search: (prev) => prev });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to update pin state.");
    } finally {
      setIsPinning(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      setIsBookmarking(true);
      await updateAnalysis({ data: { id: analysis.id, bookmarked: !analysis.bookmarked } });
      toast.success(!analysis.bookmarked ? "Analysis bookmarked." : "Analysis unbookmarked.");
      navigate({ search: (prev) => prev });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to update bookmark state.");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          nav, aside, .no-print, button, header, .app-sidebar, [role="button"] {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .panel {
            border: 1px solid #e2e8f0 !important;
            background: transparent !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin-bottom: 1rem;
          }
        }
      `,
        }}
      />
      <Button variant="ghost" size="sm" className="mb-4 no-print" asChild>
        <Link to="/app/projects/$id" params={{ id: project.id }}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {project.name}
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {email ? email.subject : "Manual Scope Scan"}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            {email ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-medium">
                    {email.fromInitials}
                  </div>
                  {email.from}
                </div>
                <span>·</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Manual Requirements Scan</span>
                </div>
                <span>·</span>
              </>
            )}
            <span>{project.client}</span>
            <span>·</span>
            <StatusPill status={project.status} />
            <span>·</span>
            <RiskChip level={project.risk} />
            <span>·</span>
            <span>Analyzed {analysis.createdAt}</span>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 no-print">
            <Button
              variant="outline"
              size="sm"
              disabled={isPinning}
              onClick={handleTogglePin}
              className={
                analysis.pinned
                  ? "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 h-8 text-[12px]"
                  : "text-muted-foreground h-8 text-[12px]"
              }
              title={analysis.pinned ? "Unpin this analysis" : "Pin this analysis"}
            >
              <Pin
                className="mr-1.5 h-3.5 w-3.5"
                fill={analysis.pinned ? "currentColor" : "none"}
              />
              {analysis.pinned ? "Pinned" : "Pin"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isBookmarking}
              onClick={handleToggleBookmark}
              className={
                analysis.bookmarked
                  ? "text-[color:var(--warning)] border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 hover:bg-[color:var(--warning)]/10 h-8 text-[12px]"
                  : "text-muted-foreground h-8 text-[12px]"
              }
              title={analysis.bookmarked ? "Unbookmark this analysis" : "Bookmark this analysis"}
            >
              <Bookmark
                className="mr-1.5 h-3.5 w-3.5"
                fill={analysis.bookmarked ? "currentColor" : "none"}
              />
              {analysis.bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isRegenerating}
              onClick={handleRegenerate}
              className="text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 h-8 text-[12px]"
              title="Re-run Gemini AI analysis"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Analyzing..." : "Regenerate AI"}
            </Button>

            <ExportButton
              defaultScope="analysis"
              defaultTargetId={analysis.id}
              label="Export Report"
              className="h-8 text-[12px]"
            />
          </div>

          <div className="text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-1.5 rounded border border-primary/20 shrink-0 h-8 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            {analysis.isFallback
              ? "Fallback: Rule Engine"
              : `AI Model: ${analysis.aiModel || "gemini-2.5-flash"}`}
          </div>
          {analysis.processingTime ? (
            <div className="text-[11px] font-medium bg-accent px-2.5 py-1.5 rounded border border-border/40 shrink-0 h-8 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {analysis.processingTime}ms
            </div>
          ) : null}
          <div className="text-[11px] font-medium bg-accent px-2.5 py-1.5 rounded border border-border/40 capitalize shrink-0 h-8 flex items-center">
            Status: {analysis.status}
          </div>
          <div className="text-[11px] font-medium bg-accent px-2.5 py-1.5 rounded border border-border/40 capitalize shrink-0 h-8 flex items-center">
            Priority: {analysis.priority}
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium shrink-0 h-8 ${verdict.bg}`}
          >
            <VerdictIcon className="h-4 w-4" />
            {verdict.label}
          </div>
        </div>
      </div>

      {/* Summary Alert */}
      {analysis.aiSummary && (
        <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-foreground">AI Executive Summary</div>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">{analysis.aiSummary}</p>
          </div>
        </div>
      )}

      {/* Stat Row */}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          {
            icon: Sparkles,
            l: "Confidence Score",
            v: `${analysis.confidence}%`,
          },
          {
            icon: Clock,
            l: "Extra Hours Required",
            v: analysis.additionalHours > 0 ? `+${analysis.additionalHours}h` : "0h",
          },
          {
            icon: Clock,
            l: "Timeline Delay",
            v:
              analysis.timelineImpactDays > 0 ? `+${analysis.timelineImpactDays} days` : "No delay",
          },
          {
            icon: DollarSign,
            l: "Suggested Cost Impact",
            v: formatCurrency(analysis.suggestedCost, currencySymbol, locale),
          },
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

      {/* Main grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Original email or manual request info */}
        <div className="panel p-6">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 mb-4">
            {email ? "Client email thread" : "Scope request context"}
          </div>
          {email ? (
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground">
              {email.body}
            </p>
          ) : (
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Baseline contract scope
                </div>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {analysis.originalRequirement}
                </p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <div className="text-[11px] font-semibold text-foreground uppercase">
                  New/Changed requirement ask
                </div>
                <p className="mt-1 leading-relaxed font-medium">{analysis.changedRequirement}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI reasoning */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Difference Explanation
          </div>
          <p className="text-[13px] leading-relaxed text-foreground">
            {analysis.explanation || analysis.reasoning}
          </p>
        </div>

        {/* Structural Changes Breakdown */}
        <div className="panel p-6 lg:col-span-2">
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 mb-4">
            Structural Scope Differences
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-[12px] font-semibold text-[color:var(--success)] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                In Scope Features
              </div>
              {analysis.includedFeatures && analysis.includedFeatures.length > 0 ? (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {analysis.includedFeatures.map((f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 bg-accent/20 px-2.5 py-1.5 rounded border border-border/30"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--success)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground mt-2 italic">
                  No matching in-scope items detected.
                </p>
              )}
            </div>

            <div>
              <div className="text-[12px] font-semibold text-[color:var(--destructive)] flex items-center gap-1.5">
                <ShieldX className="h-4 w-4" />
                Added / Out of Scope Features
              </div>
              {analysis.outOfScopeFeatures && analysis.outOfScopeFeatures.length > 0 ? (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {analysis.outOfScopeFeatures.map((f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 bg-destructive/5 px-2.5 py-1.5 rounded border border-destructive/10 text-destructive"
                    >
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground mt-2 italic">
                  No out-of-scope creep detected.
                </p>
              )}
            </div>

            <div>
              <div className="text-[12px] font-semibold text-[color:var(--warning)] flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Modified / Priority Changes
              </div>
              {analysis.detectedFeatures &&
              analysis.detectedFeatures.filter(
                (f: string) => !analysis.outOfScopeFeatures.includes(f),
              ).length > 0 ? (
                <ul className="mt-3 space-y-2 text-[13px]">
                  {analysis.detectedFeatures
                    .filter((f: string) => !analysis.outOfScopeFeatures.includes(f))
                    .map((f: string) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 bg-[color:var(--warning)]/5 px-2.5 py-1.5 rounded border border-[color:var(--warning)]/10 text-[color:var(--warning)]"
                      >
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--warning)]" />
                        <span>{f} (Modified)</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-[12px] text-muted-foreground mt-2 italic">
                  No modified scope requirements detected.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Missing Requirements & SOW Discrepancies */}
        {analysis.missingRequirements && analysis.missingRequirements.length > 0 && (
          <div className="panel p-6 lg:col-span-2 bg-warning/5 border-warning/20">
            <div className="text-[12px] font-medium uppercase tracking-wider text-warning border-b border-warning/10 pb-2 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning animate-bounce" />
              Missing Information Needed from Client
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {analysis.missingRequirements.map((r: string, idx: number) => (
                <li
                  key={idx}
                  className="text-[13px] bg-background/50 border border-warning/10 p-3 rounded-lg leading-relaxed flex items-start gap-2.5"
                >
                  <span className="font-bold text-[11px] bg-warning/20 text-warning px-1.5 py-0.5 rounded shrink-0">
                    #{idx + 1}
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Potential Risks & Recommendations */}
        {((analysis.potentialRisks && analysis.potentialRisks.length > 0) ||
          (analysis.recommendations && analysis.recommendations.length > 0)) && (
          <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
            {analysis.potentialRisks && analysis.potentialRisks.length > 0 && (
              <div className="panel p-6 border-destructive/20 bg-destructive/5">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-destructive border-b border-destructive/20 pb-2 mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Potential Risks
                </div>
                <ul className="space-y-2 text-[13px]">
                  {analysis.potentialRisks.map((risk: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/90">
                      <span className="text-destructive font-bold">•</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="panel p-6 border-primary/20 bg-primary/5">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-primary border-b border-primary/20 pb-2 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Recommendations
                </div>
                <ul className="space-y-2 text-[13px]">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/90">
                      <span className="text-primary font-bold">✓</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggested reply */}
        {analysis.suggestedReply && (
          <div className="panel p-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-4">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Suggested client email response
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-[color:var(--success)]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-background/40 px-5 py-4 font-serif text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
              {analysis.suggestedReply}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
