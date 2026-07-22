import { cn } from "@/lib/utils";
import type { ProjectStatus, RiskLevel } from "@/models/Project";

const statusMap: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  on_track: {
    label: "On track",
    className:
      "text-[color:var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]",
    dot: "bg-[color:var(--success)]",
  },
  at_risk: {
    label: "At risk",
    className:
      "text-[color:var(--warning)] bg-[color-mix(in_oklab,var(--warning)_14%,transparent)]",
    dot: "bg-[color:var(--warning)]",
  },
  scope_creep: {
    label: "Scope creep",
    className:
      "text-[color:var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)]",
    dot: "bg-[color:var(--destructive)]",
  },
  completed: {
    label: "Completed",
    className: "text-muted-foreground bg-accent",
    dot: "bg-muted-foreground",
  },
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        s.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

const riskMap: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low risk", className: "text-[color:var(--success)]" },
  medium: { label: "Medium risk", className: "text-[color:var(--warning)]" },
  high: { label: "High risk", className: "text-[color:var(--destructive)]" },
};

export function RiskChip({ level }: { level: RiskLevel }) {
  const r = riskMap[level];
  return <span className={cn("text-[11px] font-medium", r.className)}>{r.label}</span>;
}
