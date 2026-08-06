import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  Mail,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  Plus,
  Moon,
  Sun,
  Download,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/components/theme-toggle";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
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

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!mounted) return null;

  const runCommand = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search ScopeGuard..." />
      <CommandList className="max-h-[330px] overflow-y-auto p-2">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>Dashboard</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/projects" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <FolderKanban className="h-4 w-4 text-primary" />
            <span>Projects</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/inbox" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span>Email Monitoring</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/history" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Analysis History</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/analytics" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Analytics & Reports</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/notifications" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <Bell className="h-4 w-4 text-primary" />
            <span>Notifications</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/settings" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <Settings className="h-4 w-4 text-primary" />
            <span>Workspace Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1" />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/app/projects/new" }))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4 text-emerald-500" />
            <span>Create New Project</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
