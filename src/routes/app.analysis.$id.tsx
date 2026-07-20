import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RiskChip, StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { getAnalysisDetails } from "@/lib/analyses.server";
import { useState } from "react";

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
    bg: "bg-destructive/10 text-destructive",
  },
  in_scope: {
    icon: ShieldCheck,
    color: "var(--success)",
    label: "In scope",
    bg: "bg-[color:var(--success)]/10 text-[color:var(--success)]",
  },
  mixed: {
    icon: ShieldAlert,
    color: "var(--warning)",
    label: "Mixed / Partial",
    bg: "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
  },
} as const;

function AnalysisPage() {
  const { analysis, project, email } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const verdict = verdictConfig[analysis.verdict];
  const VerdictIcon = verdict.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AppShell>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
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
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium ${verdict.bg}`}
        >
          <VerdictIcon className="h-4 w-4" />
          {verdict.label}
        </div>
      </div>

      {/* Stat Row */}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          {
            icon: Sparkles,
            l: "Confidence",
            v: `${analysis.confidence}%`,
          },
          {
            icon: Clock,
            l: "Extra hours",
            v: analysis.additionalHours > 0 ? `+${analysis.additionalHours}h` : "None",
          },
          {
            icon: Clock,
            l: "Timeline impact",
            v: analysis.timelineImpactDays > 0 ? `+${analysis.timelineImpactDays} days` : "None",
          },
          {
            icon: DollarSign,
            l: "Cost at risk",
            v: analysis.suggestedCost > 0 ? `₹${analysis.suggestedCost.toLocaleString("en-IN")}` : "₹0",
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
          <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {email ? "Client email thread" : "Scope request context"}
          </div>
          {email ? (
            <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-foreground">
              {email.body}
            </p>
          ) : (
            <div className="mt-4 space-y-4 text-[13px]">
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
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI reasoning
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-foreground">{analysis.reasoning}</p>
        </div>

        {/* Feature breakdown */}
        {(analysis.includedFeatures.length > 0 || analysis.outOfScopeFeatures.length > 0) && (
          <div className="panel p-6 lg:col-span-2">
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Feature breakdown
            </div>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {analysis.includedFeatures.length > 0 && (
                <div>
                  <div className="text-[12px] font-medium text-[color:var(--success)]">
                    Included in scope
                  </div>
                  <ul className="mt-2 space-y-2 text-[13px]">
                    {analysis.includedFeatures.map((f: string) => (
                      <li key={f} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--success)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.outOfScopeFeatures.length > 0 && (
                <div>
                  <div className="text-[12px] font-medium text-[color:var(--destructive)]">
                    Out of scope
                  </div>
                  <ul className="mt-2 space-y-2 text-[13px]">
                    {analysis.outOfScopeFeatures.map((f: string) => (
                      <li key={f} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggested reply */}
        {analysis.suggestedReply && (
          <div className="panel p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Suggested reply
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
            <div className="mt-4 rounded-xl border border-border bg-background/40 px-5 py-4 font-serif text-[13px] leading-relaxed text-foreground">
              <p>{analysis.suggestedReply}</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
