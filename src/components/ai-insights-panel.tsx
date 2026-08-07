import { useMemo } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/formatters";

interface AIInsightsPanelProps {
  projects: Array<{
    id: string;
    name: string;
    risk: "low" | "medium" | "high";
    status: string;
  }>;
  analyses: Array<{
    id: string;
    verdict: string;
    suggestedCost: number;
    riskLevel: string;
  }>;
  unbilledRevenue: number;
  currencySymbol?: string;
  locale?: string;
}

export interface InsightCardItem {
  id: string;
  type: "warning" | "opportunity" | "achievement";
  title: string;
  description: string;
  actionText?: string;
  link?: string;
  icon: typeof Sparkles;
}

export function AIInsightsPanel({
  projects,
  analyses,
  unbilledRevenue,
  currencySymbol = "$",
  locale = "en-US",
}: AIInsightsPanelProps) {
  const insights = useMemo(() => {
    const list: InsightCardItem[] = [];

    // 1. High risk projects warning
    const highRiskProjects = projects.filter((p) => p.risk === "high");
    if (highRiskProjects.length > 0) {
      const topProj = highRiskProjects[0];
      list.push({
        id: "high-risk-proj",
        type: "warning",
        title: `${highRiskProjects.length} Project${highRiskProjects.length > 1 ? "s" : ""} Require Review`,
        description: `Project "${topProj.name}" has high scope creep exposure. Issue a change order or update terms.`,
        actionText: "Review Project",
        link: `/app/projects/${topProj.id}`,
        icon: AlertTriangle,
      });
    }

    // 2. Unbilled revenue opportunity
    if (unbilledRevenue > 0) {
      list.push({
        id: "unbilled-rev",
        type: "opportunity",
        title: `${formatCurrency(unbilledRevenue, currencySymbol, locale)} Unbilled Creep Revenue`,
        description:
          "Out-of-scope requests detected across active projects. Convert flagged analyses into billable client addendums.",
        actionText: "View History",
        link: "/app/history",
        icon: TrendingUp,
      });
    } else {
      list.push({
        id: "contract-aligned",
        type: "achievement",
        title: "Contract Alignment Optimal",
        description:
          "No unbilled scope leaks detected in recent client interactions. Work deliverables match client SOW.",
        actionText: "Run New Scan",
        link: "/app",
        icon: ShieldCheck,
      });
    }

    // 3. Pending scope analyses
    const confirmedCreepCount = analyses.filter(
      (a) => a.verdict === "confirmed_scope_creep",
    ).length;
    if (confirmedCreepCount > 0) {
      list.push({
        id: "scope-creep-flag",
        type: "warning",
        title: `${confirmedCreepCount} Confirmed Scope Breaches`,
        description:
          "Client emails contain out-of-scope feature requests. Use AI-generated reply drafts to respond firmly.",
        actionText: "Check Analyses",
        link: "/app/history",
        icon: FileCheck,
      });
    }

    return list.slice(0, 3);
  }, [projects, analyses, unbilledRevenue, currencySymbol, locale]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            AI Productivity Insights
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">Real-Time Evaluation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((card) => {
          const Icon = card.icon;
          const isWarning = card.type === "warning";
          const isOpportunity = card.type === "opportunity";

          return (
            <div
              key={card.id}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 shadow-xs backdrop-blur-md transition-all hover:shadow-md ${
                isWarning
                  ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                  : isOpportunity
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                    : "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                      isWarning
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : isOpportunity
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isWarning
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : isOpportunity
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    }`}
                  >
                    {card.type}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-1">
                  {card.title}
                </h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              {card.link && card.actionText && (
                <div className="pt-3 mt-2 border-t border-border/40">
                  <Link
                    to={card.link as never}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group/link"
                  >
                    <span>{card.actionText}</span>
                    <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
