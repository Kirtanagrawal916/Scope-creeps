import { Link, useNavigate, useRouterState, useRouteContext } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Mail,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  Search,
  Plus,
  LogOut,
  Menu,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExportButton } from "@/components/export/export-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CommandPalette } from "@/components/command-palette";
import { getInitials } from "@/lib/formatters";
import { logoutAction } from "@/lib/auth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}
const primary: NavItem[] = [
  { to: "/app", label: "Command center", icon: LayoutDashboard },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/inbox", label: "Inbox monitor", icon: Mail },
  { to: "/app/history", label: "Review history", icon: Sparkles },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
];
const secondary: NavItem[] = [
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium tracking-wide transition-colors",
        active
          ? "text-sidebar-foreground"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-y-0 left-0 w-0.5 bg-sidebar-primary"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon
        className={cn(
          "size-4",
          active
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/45 group-hover:text-sidebar-primary",
        )}
        strokeWidth={1.7}
      />
      <span>{item.label}</span>
      {active && <ArrowUpRight className="ml-auto size-3 text-sidebar-primary" />}
    </Link>
  );
}

function Navigation({
  onNavigate,
  onSearchClick,
}: {
  onNavigate?: () => void;
  onSearchClick?: () => void;
}) {
  const nav = useNavigate();
  const { user } = useRouteContext({ from: "/app" }) as {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      workspaceName?: string;
    } | null;
  };
  async function handleLogout() {
    try {
      await logoutAction();
    } catch (err) {
      console.error("Server logout failed:", err);
    }
    localStorage.removeItem("scopeguard_token");
    localStorage.removeItem("scopeguard_user_id");
    onNavigate?.();
    nav({ to: "/login" });
  }
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Logo className="[&_span]:text-sidebar-foreground" />
        <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
          <span className="size-1.5 rounded-full bg-sidebar-primary" /> Workspace /{" "}
          {user?.workspaceName || "My studio"}
        </div>
      </div>
      <div className="px-4 py-5">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onSearchClick?.();
          }}
          className="flex w-full items-center gap-2 border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-left text-[11px] text-sidebar-foreground/55 transition-colors hover:border-sidebar-primary/60 hover:text-sidebar-foreground"
          aria-label="Search ScopeGuard"
        >
          <Search className="size-3.5" />
          <span>Search workspace</span>
          <kbd className="ml-auto border border-sidebar-border px-1 py-0.5 font-mono text-[9px]">
            ⌘K
          </kbd>
        </button>
      </div>
      <nav className="flex-1 px-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
          Workspace
        </div>
        {primary.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
        <div className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
          Account
        </div>
        {secondary.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-sidebar-primary/20 text-xs text-sidebar-primary">
              {getInitials(user?.firstName, user?.lastName, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user?.firstName || "User"}</div>
            <div className="truncate text-[10px] text-sidebar-foreground/45">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sidebar-foreground/45 hover:text-sidebar-primary"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Navigation onSearchClick={() => setSearchOpen(true)} />
      </aside>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md lg:ml-64">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Navigation
                onNavigate={() => setOpen(false)}
                onSearchClick={() => setSearchOpen(true)}
              />
            </SheetContent>
          </Sheet>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            ScopeGuard / {pathname.replace("/app", "") || "overview"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" compact />
            <NotificationBell />
          </div>
        </div>
      </header>
      <div className="lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-4 border-b border-border px-4 py-8 sm:px-6 lg:px-10"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-6 bg-primary/60" />
              Workspace brief
            </p>
            <h1 className="mt-3 truncate font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">{action}</div>
            <ExportButton
              defaultScope="workspace"
              label="Export"
              variant="outline"
              className="hidden h-8 text-xs sm:flex"
            />
            <Button size="sm" className="gap-1.5" asChild>
              <Link to="/app/projects/new">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New project</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          </div>
        </motion.div>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          <div>
            {title && (
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function SparkleIcon() {
  return <Sparkles className="size-3.5" />;
}
