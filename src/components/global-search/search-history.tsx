import { useEffect, useState } from "react";
import { History, Trash2, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HISTORY_KEY = "scopeguard_search_history";

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(query: string): SearchHistoryItem[] {
  if (typeof window === "undefined" || !query.trim()) return getSearchHistory();
  try {
    const history = getSearchHistory().filter((h) => h.query.toLowerCase() !== query.toLowerCase());
    const updated = [{ query: query.trim(), timestamp: Date.now() }, ...history].slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error("Failed to clear search history:", err);
  }
}

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void;
}

export function SearchHistory({ onSelectQuery }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleClear = () => {
    clearSearchHistory();
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <div className="p-3 border-b border-border/40 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <History className="h-3 w-3" /> Recent Searches
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-2.5 w-2.5 mr-1" /> Clear
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {history.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuery(item.query)}
            className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs text-foreground hover:bg-accent hover:border-primary/30 transition-colors"
          >
            <Search className="h-3 w-3 text-muted-foreground" />
            <span>{item.query}</span>
            <ArrowUpRight className="h-2.5 w-2.5 text-muted-foreground/70" />
          </button>
        ))}
      </div>
    </div>
  );
}
