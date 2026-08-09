import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ScrollText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listAuditLogs } from "@/lib/audit-log.server";
import type { SerializedAuditLog } from "@/lib/audit-log.server";

export const Route = createFileRoute("/app/admin/audit-logs")({
  loader: async () => {
    const logs = await listAuditLogs();
    return { logs };
  },
  component: AuditLogsPage,
  head: () => ({ meta: [{ title: "Audit Logs — Admin — ScopeGuard" }] }),
});

const ACTION_LABELS: Record<SerializedAuditLog["action"], string> = {
  admin_login: "Admin login",
  user_updated: "User updated",
  user_role_changed: "Role changed",
  user_activated: "User activated",
  user_deactivated: "User deactivated",
  feature_flag_toggled: "Flag toggled",
  feature_flag_created: "Flag created",
};

function ActionBadge({ action }: { action: SerializedAuditLog["action"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        action === "admin_login" && "bg-accent text-muted-foreground",
        (action === "user_updated" || action === "user_role_changed") &&
          "text-[color:var(--info,theme(colors.blue.500))] bg-[color-mix(in_oklab,var(--info,theme(colors.blue.500))_12%,transparent)]",
        (action === "user_activated" || action === "feature_flag_created") &&
          "text-[color:var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]",
        (action === "user_deactivated" || action === "feature_flag_toggled") &&
          "text-muted-foreground bg-accent",
      )}
    >
      {ACTION_LABELS[action]}
    </span>
  );
}

function AuditLogsPage() {
  const { logs } = Route.useLoaderData();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.actorEmail.toLowerCase().includes(q) ||
      log.message.toLowerCase().includes(q) ||
      ACTION_LABELS[log.action].toLowerCase().includes(q)
    );
  });

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AppShell title="Audit Logs" subtitle="A record of admin actions across the workspace.">
      <div className="mb-5">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by admin, action, or message…"
            className="pl-8 bg-background/50 backdrop-blur"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
          <ScrollText className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-[15px] font-medium">No audit log entries found</div>
          <p className="max-w-xs text-[13px] text-muted-foreground">
            Admin logins, user edits, and feature flag changes will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="hidden grid-cols-[1fr_0.9fr_2fr_auto] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div>Admin</div>
              <div>Action</div>
              <div>Details</div>
              <div>When</div>
            </div>
            <div className="divide-y divide-border">
              {paginated.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:px-5 md:grid md:grid-cols-[1fr_0.9fr_2fr_auto] md:items-center md:gap-4"
                >
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {log.actorEmail}
                  </div>
                  <div>
                    <ActionBadge action={log.action} />
                  </div>
                  <div className="truncate text-[13px] text-muted-foreground">{log.message}</div>
                  <div className="text-[12px] text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 text-[13px]">
              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages} ({filtered.length} entries)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
