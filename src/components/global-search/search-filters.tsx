import { type SearchCategory } from "@/lib/search.server";
import { FolderKanban, Users, Sparkles, Bell, Mail, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  activeCategory: SearchCategory;
  onCategoryChange: (cat: SearchCategory) => void;
  counts?: {
    all: number;
    projects: number;
    clients: number;
    analyses: number;
    notifications: number;
    emails: number;
  };
}

const filterConfig: {
  id: SearchCategory;
  label: string;
  icon: typeof FolderKanban;
}[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "clients", label: "Clients", icon: Users },
  { id: "analyses", label: "Analyses", icon: Sparkles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "emails", label: "Emails", icon: Mail },
];

export function SearchFilters({ activeCategory, onCategoryChange, counts }: SearchFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-border/40 scrollbar-none">
      {filterConfig.map((item) => {
        const Icon = item.icon;
        const isActive = activeCategory === item.id;
        const count = counts ? counts[item.id] : undefined;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onCategoryChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background/80 text-muted-foreground border border-border/50",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
