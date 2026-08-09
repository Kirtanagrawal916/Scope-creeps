import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Users, Activity, Flag, FileText, Cpu, Download, Database, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin Portal — ScopeGuard" }] }),
});

function AdminLayout() {
  const location = useLocation();

  const tabs = [
    { name: "Users", path: "/app/admin/users", icon: Users },
    { name: "Metrics", path: "/app/admin/metrics", icon: Activity },
    { name: "Feature Flags", path: "/app/admin/feature-flags", icon: Flag },
    { name: "Audit Logs", path: "/app/admin/audit-logs", icon: FileText },
    { name: "AI Usage", path: "/app/admin/ai-usage", icon: Cpu },
    { name: "Exports Queue", path: "/app/admin/export", icon: Download },
    { name: "API Health", path: "/app/admin/api-metrics", icon: Database },
  ];

  return (
    <AppShell
      title="Admin Control Center"
      subtitle="System telemetry, user management, feature flags, and audit logs."
    >
      {/* Tab Navigation Bar */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path) || (location.pathname === "/app/admin" && tab.name === "Users");

          return (
            <Link
              key={tab.name}
              to={tab.path as any}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Render Active Sub-Route Content */}
      <Outlet />
    </AppShell>
  );
}
