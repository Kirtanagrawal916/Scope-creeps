/**
 * constants.ts — Shared Application Constants & Display Mappings
 */

export const PROJECT_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  }
> = {
  on_track: { label: "On Track", variant: "success" },
  at_risk: { label: "At Risk", variant: "warning" },
  scope_creep: { label: "Scope Creep", variant: "destructive" },
  completed: { label: "Completed", variant: "secondary" },
};

export const RISK_LEVEL_MAP: Record<
  string,
  { label: string; color: string; badgeVariant: "success" | "warning" | "destructive" }
> = {
  low: { label: "Low Risk", color: "text-emerald-500", badgeVariant: "success" },
  medium: { label: "Medium Risk", color: "text-amber-500", badgeVariant: "warning" },
  high: { label: "High Risk", color: "text-red-500", badgeVariant: "destructive" },
};

export const VERDICT_DISPLAY_MAP: Record<
  string,
  { label: string; badgeClass: string; iconName: string }
> = {
  in_scope: {
    label: "In Scope",
    badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    iconName: "ShieldCheck",
  },
  possible_scope_creep: {
    label: "Possible Scope Creep",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    iconName: "AlertTriangle",
  },
  confirmed_scope_creep: {
    label: "Confirmed Scope Creep",
    badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
    iconName: "ShieldAlert",
  },
  out_of_scope: {
    label: "Out of Scope",
    badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    iconName: "ShieldX",
  },
  mixed: {
    label: "Mixed Scope",
    badgeClass: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    iconName: "HelpCircle",
  },
};

export const NOTIFICATION_PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  low: { label: "Low", class: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  high: { label: "High", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  urgent: { label: "Urgent", class: "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" },
};
