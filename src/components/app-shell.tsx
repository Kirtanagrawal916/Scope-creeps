import { Link, useNavigate, useRouterState, useRouteContext } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { deleteSessionCookie } from "@/lib/auth";
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
  ChevronsUpDown,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const primary: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projects", label: "Projects", icon: FolderKanban, badge: "5" },
  { to: "/app/inbox", label: "Email monitoring", icon: Mail, badge: "3" },
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
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-lg bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

const logoutAction = createServerFn({ method: "POST" }).handler(async () => {
  deleteSessionCookie();
  return { success: true };
});

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
    <>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-sidebar-accent">
          <Logo />
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-3 pt-2">
        <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="rounded border border-border bg-background/60 px-1.5 py-[1px] font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          {primary.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="space-y-1">
          <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </div>
          {secondary.map((item) => (
            <NavLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <ThemeToggle className="mb-3 w-full justify-center bg-background/45" compact />
        <div className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-sidebar-accent">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/20 text-[11px] font-medium text-primary">
              {user?.firstName
                ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-[13px] font-medium text-foreground">
              {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "User"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {user?.workspaceName || "Workspace"}
            </div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex min-h-screen w-full bg-background/80">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-2xl lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-8 md:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar p-0"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground sm:text-[18px]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-0.5 hidden truncate text-[13px] text-muted-foreground sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle className="hidden lg:flex" compact />
            <div className="hidden sm:block">{action}</div>
            <Button size="sm" className="gap-1.5" asChild>
              <Link to="/app/projects/new">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New project</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
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
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <h2 className="truncate text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SparkleIcon() {
  return <Sparkles className="h-3.5 w-3.5" />;
}
