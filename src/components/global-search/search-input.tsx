import { Search, Loader2, X, Command } from "lucide-react";
import { type SearchCategory } from "@/lib/search.server";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  query: string;
  onQueryChange: (val: string) => void;
  isLoading?: boolean;
  category: SearchCategory;
  onClear: () => void;
}

export function SearchInput({
  query,
  onQueryChange,
  isLoading,
  category,
  onClear,
}: SearchInputProps) {
  return (
    <div className="relative flex items-center px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-md">
      <Search className="h-4 w-4 text-primary shrink-0 mr-3" />

      {category !== "all" && (
        <span className="mr-2 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider shrink-0">
          {category}
        </span>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search projects, clients, analyses, emails (e.g., project:ScopeGuard risk:high)..."
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        autoFocus
        aria-label="Search ScopeGuard workspace"
      />

      <div className="flex items-center gap-2 shrink-0 ml-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : query ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground font-medium">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </div>
    </div>
  );
}
