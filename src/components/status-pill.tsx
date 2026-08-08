import { cn } from "@/lib/utils";
import type { ProjectStatus, RiskLevel } from "@/models/Project";
const statusMap: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  on_track: { label: "On track", className: "text-success bg-success/10", dot: "bg-success" },
  at_risk: { label: "At risk", className: "text-warning bg-warning/10", dot: "bg-warning" },
  scope_creep: {
    label: "Scope creep",
    className: "text-destructive bg-destructive/10",
    dot: "bg-destructive",
  },
  completed: {
    label: "Completed",
    className: "text-muted-foreground bg-muted",
    dot: "bg-muted-foreground",
  },
};
export function StatusPill({ status }: { status: ProjectStatus }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wide",
        s.className,
      )}
    >
      <span className={cn("size-1.5", s.dot)} />
      {s.label}
    </span>
  );
}
const riskMap: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low risk", className: "text-success" },
  medium: { label: "Medium risk", className: "text-warning" },
  high: { label: "High risk", className: "text-destructive" },
};
export function RiskChip({ level }: { level: RiskLevel }) {
  const r = riskMap[level];
  return (
    <span className={cn("font-mono text-[10px] font-medium uppercase tracking-wide", r.className)}>
      {r.label}
    </span>
  );
}
