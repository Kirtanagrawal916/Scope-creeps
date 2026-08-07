import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Keyboard,
  Command,
  Sparkles,
  FolderPlus,
  Download,
  Search,
  HelpCircle,
} from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerSearch?: () => void;
  onTriggerExport?: () => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Keyboard className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Master ScopeGuard productivity shortcuts for lightning-fast workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 divide-y divide-border/40 text-xs">
            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-medium text-foreground">Global Search</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                  ⌘
                </kbd>
                <span className="text-[10px] text-muted-foreground">+</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                  K
                </kbd>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium text-foreground">Create New Project</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                N
              </kbd>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-medium text-foreground">Analyze Scope / Scan</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                A
              </kbd>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-medium text-foreground">Export Reports</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                E
              </kbd>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
                <span className="font-medium text-foreground">Shortcuts Cheat Sheet</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                ?
              </kbd>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <div className="flex items-center gap-2">
                <Command className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-medium text-foreground">Close Modals / Overlays</span>
              </div>
              <kbd className="px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border/80 rounded-md">
                Esc
              </kbd>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to listen for global productivity keyboard shortcuts across the app.
 */
export function useGlobalShortcuts({
  onOpenSearch,
  onOpenExport,
  onOpenShortcuts,
}: {
  onOpenSearch?: () => void;
  onOpenExport?: () => void;
  onOpenShortcuts?: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if user is typing in an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      // ⌘ + K / Ctrl + K -> Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearch?.();
        return;
      }

      // ? -> Shortcuts Cheat Sheet
      if (e.key === "?") {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      // N -> New Project
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate({ to: "/app/projects/new" as never });
        return;
      }

      // A -> Analyze / Dashboard scan
      if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate({ to: "/app" as never });
        return;
      }

      // E -> Export Dialog
      if (e.key.toLowerCase() === "e" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenExport?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onOpenSearch, onOpenExport, onOpenShortcuts]);
}
