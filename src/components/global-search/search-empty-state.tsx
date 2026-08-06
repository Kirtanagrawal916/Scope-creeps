import { Search, Sparkles, FolderKanban, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  query?: string;
  onSelectSuggestion?: (suggestion: string) => void;
}

const suggestions = [
  { label: "High Risk Projects", query: "risk:high" },
  { label: "Pending Scope Analyses", query: "status:pending" },
  { label: "High Confidence (>80)", query: "confidence>80" },
  { label: "Scope Creep Detected", query: "verdict:confirmed_scope_creep" },
  { label: "Urgent Notifications", query: "priority:urgent" },
  { label: "Last 30 Days", query: "date:last30days" },
];

export function SearchEmptyState({ query, onSelectSuggestion }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
        <Search className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-foreground">
          {query ? `No results found for "${query}"` : "Search across your workspace"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {query
            ? "Try checking for typos or use search filter chips like project: or risk:high"
            : "Quickly find projects, clients, AI scope analyses, notifications, and emails."}
        </p>
      </div>

      <div className="w-full max-w-md pt-2 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block text-left">
          Suggested Filters & Queries
        </span>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {suggestions.map((s) => (
            <button
              key={s.query}
              type="button"
              onClick={() => onSelectSuggestion?.(s.query)}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-primary/30 transition-all text-left group"
            >
              <span className="truncate">{s.label}</span>
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
