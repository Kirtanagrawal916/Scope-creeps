import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import type { AdminUser } from "@/lib/admin.server";

// ---------------------------------------------------------------------------
// Route-level access check
// ---------------------------------------------------------------------------
// Dynamically imports admin.server.ts inside the handler (same pattern as
// app.tsx's checkAuth) so server-only code never leaks into the client bundle.

const checkAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { verifyAdminAccess } = await import("@/lib/admin.server");
  try {
    const admin = await verifyAdminAccess();
    return { authorized: true as const, admin };
  } catch {
    return { authorized: false as const, admin: null };
  }
});

export const Route = createFileRoute("/app/admin")({
  beforeLoad: async () => {
    const result = await checkAdminAccess();
    if (!result.authorized || !result.admin) {
      // Authenticated but not an admin (or session invalid) — send back to
      // the regular dashboard rather than /login, since /app's own beforeLoad
      // already guarantees a logged-in user got this far.
      throw redirect({ to: "/app" });
    }
    return { admin: result.admin };
  },
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin — ScopeGuard" }] }),
});

// Names only — no data, no logic. Populated module-by-module in later phases.
const upcomingModules = [
  "System Metrics",
  "AI Usage",
  "API Metrics",
  "Export Usage",
  "Audit Logs",
  "Feature Flags",
  "Users",
];

function AdminDashboard() {
  const { admin } = Route.useRouteContext() as { admin: AdminUser };

  return (
    <AppShell title="Admin Dashboard" subtitle="Workspace-wide administration">
      <div className="rounded-xl border border-dashed border-border bg-background/40 p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-[15px] font-semibold text-foreground">Admin foundation is live</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Signed in as {admin.email}. This route is protected and reserved for admin-only tooling —
          the modules below will be implemented in upcoming phases.
        </p>
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {upcomingModules.map((moduleName) => (
            <li
              key={moduleName}
              className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-[12px] text-muted-foreground"
            >
              {moduleName}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
