import { Link } from "@tanstack/react-router";
import {
  FolderPlus,
  Sparkles,
  Download,
  Bell,
  BarChart3,
  Search,
  History,
  Keyboard,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface QuickActionsPanelProps {
  onOpenSearch?: () => void;
  onOpenExport?: () => void;
  onOpenShortcuts?: () => void;
}

export function QuickActionsPanel({
  onOpenSearch,
  onOpenExport,
  onOpenShortcuts,
}: QuickActionsPanelProps) {
  const handleSearch = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
      );
    }
  };

  const handleExport = () => {
    if (onOpenExport) {
      onOpenExport();
    } else {
      window.dispatchEvent(new CustomEvent("open-export-dialog"));
    }
  };

  const handleShortcuts = () => {
    if (onOpenShortcuts) {
      onOpenShortcuts();
    } else {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    }
  };

  const actions = [
    {
      id: "new-project",
      label: "New Project",
      subLabel: "Create contract workspace",
      icon: FolderPlus,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      to: "/app/projects/new",
    },
    {
      id: "analyze-scope",
      label: "Analyze Scope",
      subLabel: "Scan email for creep",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      to: "/app",
    },
    {
      id: "export-reports",
      label: "Export Reports",
      subLabel: "PDF, Excel & CSV",
      icon: Download,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      onClick: handleExport,
    },
    {
      id: "global-search",
      label: "Search Workspace",
      subLabel: "Cmd + K shortcut",
      icon: Search,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      onClick: handleSearch,
    },
    {
      id: "analytics",
      label: "Analytics",
      subLabel: "Revenue & risk charts",
      icon: BarChart3,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      to: "/app/analytics",
    },
    {
      id: "shortcuts",
      label: "Hotkeys Cheat Sheet",
      subLabel: "Press ? anytime",
      icon: Keyboard,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      onClick: handleShortcuts,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        const CardContent = (
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3 shadow-2xs backdrop-blur-md hover:border-primary/40 hover:bg-accent/40 transition-all h-full min-h-[72px]"
          >
            <div className="flex items-center gap-3 min-w-0 pr-1">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${act.color}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate">
                  {act.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-snug mt-0.5">
                  {act.subLabel}
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-1 group-hover:translate-x-0" />
          </motion.div>
        );

        if (act.to) {
          return (
            <Link key={act.id} to={act.to as never} className="block h-full">
              {CardContent}
            </Link>
          );
        }

        return (
          <button
            key={act.id}
            type="button"
            onClick={act.onClick}
            className="block h-full text-left w-full cursor-pointer"
          >
            {CardContent}
          </button>
        );
      })}
    </div>
  );
}
