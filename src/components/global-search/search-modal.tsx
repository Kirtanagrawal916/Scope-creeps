import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  globalSearch,
  type SearchCategory,
  type SearchResultItem,
  type GlobalSearchResponse,
} from "@/lib/search.server";
import { SearchInput } from "./search-input";
import { SearchFilters } from "./search-filters";
import { SearchResultCard } from "./search-result-card";
import { SearchHistory, saveSearchHistory } from "./search-history";
import { SearchEmptyState } from "./search-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  initialCategory?: SearchCategory;
}

const CATEGORY_LIST: SearchCategory[] = [
  "all",
  "projects",
  "clients",
  "analyses",
  "notifications",
  "emails",
];

export function GlobalSearchModal({
  open,
  onOpenChange,
  initialQuery = "",
  initialCategory = "all",
}: GlobalSearchModalProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [response, setResponse] = useState<GlobalSearchResponse | null>(null);

  // In-memory cache for instant responses
  const cacheRef = useRef<Map<string, GlobalSearchResponse>>(new Map());
  const activeRequestIdRef = useRef<number>(0);

  // Handle global shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !open)) {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Execute Search with 250ms debounce & race condition protection
  const executeSearch = useCallback(async (searchQuery: string, searchCategory: SearchCategory) => {
    const cacheKey = `${searchCategory}:${searchQuery.trim().toLowerCase()}`;

    if (cacheRef.current.has(cacheKey)) {
      setResponse(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const requestId = ++activeRequestIdRef.current;

    try {
      const res = await globalSearch({
        data: {
          query: searchQuery,
          category: searchCategory,
          limit: 30,
        },
      });

      // Ensure we only update state if this is the most recent request
      if (requestId === activeRequestIdRef.current) {
        cacheRef.current.set(cacheKey, res);
        setResponse(res);
        setSelectedIndex(0);
      }
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced query effect (250ms)
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      executeSearch(query, category);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, category, open, executeSearch]);

  const results = useMemo(() => response?.results || [], [response?.results]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!open) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0,
        );
        return;
      }

      if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (query.trim()) {
          saveSearchHistory(query);
        }
        onOpenChange(false);
        navigate({ to: selected.url as never });
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const currentIdx = CATEGORY_LIST.indexOf(category);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + CATEGORY_LIST.length) % CATEGORY_LIST.length
          : (currentIdx + 1) % CATEGORY_LIST.length;
        setCategory(CATEGORY_LIST[nextIdx]);
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [open, results, selectedIndex, query, category, onOpenChange, navigate]);

  const handleSelectItem = (item: SearchResultItem) => {
    if (query.trim()) {
      saveSearchHistory(query);
    }
    onOpenChange(false);
    navigate({ to: item.url as never });
  };

  const handleRefresh = () => {
    cacheRef.current.clear();
    executeSearch(query, category);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-xl transition-all"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-2xl dark:shadow-black/50"
        >
          {/* Top Search Input */}
          <SearchInput
            query={query}
            onQueryChange={setQuery}
            isLoading={loading}
            category={category}
            onClear={() => setQuery("")}
          />

          {/* Filter Chips */}
          <SearchFilters
            activeCategory={category}
            onCategoryChange={setCategory}
            counts={response?.counts}
          />

          {/* Search History when query is empty */}
          {!query && <SearchHistory onSelectQuery={(q) => setQuery(q)} />}

          {/* Main Scrollable Results Container */}
          <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted">
            {loading && results.length === 0 ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div role="listbox" className="space-y-1">
                {results.map((item, idx) => (
                  <SearchResultCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    isSelected={idx === selectedIndex}
                    query={query}
                    onSelect={() => handleSelectItem(item)}
                    onItemUpdated={handleRefresh}
                  />
                ))}
              </div>
            ) : (
              <SearchEmptyState query={query} onSelectSuggestion={(s) => setQuery(s)} />
            )}
          </div>

          {/* Footer Legend */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/40 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/60 bg-background px-1 py-0.2 font-mono text-[9px]">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/60 bg-background px-1 py-0.2 font-mono text-[9px]">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/60 bg-background px-1 py-0.2 font-mono text-[9px]">
                  Tab
                </kbd>
                Filter
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Esc to close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
