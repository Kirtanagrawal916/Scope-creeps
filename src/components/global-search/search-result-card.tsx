import { type SearchResultItem } from "@/lib/search.server";
import {
  FolderKanban,
  Users,
  Sparkles,
  Bell,
  Mail,
  Pin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { QuickActions } from "./quick-actions";
import { cn } from "@/lib/utils";

interface SearchResultCardProps {
  item: SearchResultItem;
  isSelected: boolean;
  query?: string;
  onSelect: () => void;
  onItemUpdated?: () => void;
}

const typeIconMap = {
  project: FolderKanban,
  client: Users,
  analysis: Sparkles,
  notification: Bell,
  email: Mail,
};

const typeBadgeStyle = {
  project: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  client: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  analysis: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  notification: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  email: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

const riskBadgeStyle = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const verdictBadgeStyle: Record<string, string> = {
  in_scope: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  possible_scope_creep: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed_scope_creep: "bg-red-500/10 text-red-500 border-red-500/20",
  out_of_scope: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  mixed: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;

  const cleanQuery = query
    .replace(/(project|client|risk|priority|status|date|confidence):[^\s]+/gi, "")
    .trim();

  if (!cleanQuery) return <>{text}</>;

  const terms = cleanQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="bg-primary/20 text-primary font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SearchResultCard({
  item,
  isSelected,
  query,
  onSelect,
  onItemUpdated,
}: SearchResultCardProps) {
  const Icon = typeIconMap[item.type] || FolderKanban;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        "group relative flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 cursor-pointer transition-all border border-transparent",
        isSelected
          ? "bg-accent/80 border-primary/30 shadow-sm"
          : "hover:bg-accent/40 hover:border-border/50",
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-muted-foreground transition-colors",
            isSelected ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted/40",
          )}
        >
          {item.type === "client" ? (
            <span className="text-xs font-bold text-primary">{item.clientInitials || "CL"}</span>
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {item.pinned && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}
            <span className="font-semibold text-xs text-foreground truncate">
              <HighlightText text={item.title} query={query} />
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground truncate">
            <HighlightText text={item.subtitle} query={query} />
          </p>

          {item.snippet && (
            <p className="text-[10px] text-muted-foreground/80 line-clamp-1 italic">
              <HighlightText text={item.snippet} query={query} />
            </p>
          )}

          {/* Badges container */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span
              className={cn(
                "rounded border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider",
                typeBadgeStyle[item.type],
              )}
            >
              {item.type}
            </span>

            {item.risk && (
              <span
                className={cn(
                  "rounded border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider flex items-center gap-0.5",
                  riskBadgeStyle[item.risk],
                )}
              >
                {item.risk === "high" && <AlertTriangle className="h-2.5 w-2.5" />}
                {item.risk} risk
              </span>
            )}

            {item.verdict && (
              <span
                className={cn(
                  "rounded border px-1.5 py-0.2 text-[9px] font-semibold tracking-wider",
                  verdictBadgeStyle[item.verdict] || "bg-muted text-muted-foreground",
                )}
              >
                {item.verdict.replace(/_/g, " ")}
              </span>
            )}

            {item.confidence !== undefined && (
              <span className="rounded border border-primary/20 bg-primary/5 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                {item.confidence}% confidence
              </span>
            )}

            {item.priority && item.type !== "analysis" && (
              <span className="rounded border border-border bg-muted/50 px-1.5 py-0.2 text-[9px] text-muted-foreground uppercase font-medium">
                {item.priority}
              </span>
            )}

            {item.unread && (
              <span className="rounded-full bg-emerald-500 h-1.5 w-1.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {item.updatedAt || item.createdAt}
        </span>
        <QuickActions item={item} onItemUpdated={onItemUpdated} />
      </div>
    </div>
  );
}
