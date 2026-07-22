import { createFileRoute } from "@tanstack/react-router";
import { Bell, Sparkles, Mail, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listProjects } from "@/lib/projects.server";
import { listAllUserEmails } from "@/lib/emails.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";

export const Route = createFileRoute("/app/notifications")({
  loader: async () => {
    const [projects, emails, analyses] = await Promise.all([
      listProjects(),
      listAllUserEmails(),
      listAllUserAnalyses(),
    ]);
    return { projects, emails, analyses };
  },
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — ScopeGuard" }] }),
});

type NotificationItem = {
  id: string;
  icon: typeof Sparkles;
  tone: "primary" | "success" | "muted";
  t: string;
  m: string;
  time: string;
  unread?: boolean;
};

function NotificationsPage() {
  const { projects, emails, analyses } = Route.useLoaderData();
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  // Build notifications from the user's own data — no seeded/demo entries.
  const items: NotificationItem[] = [
    ...analyses.map((a) => ({
      id: `analysis-${a.id}`,
      icon: Sparkles,
      tone: "primary" as const,
      t:
        a.verdict === "out_of_scope"
          ? `Scope creep detected on ${projectNameById.get(a.projectId) ?? "a project"}`
          : `Analysis completed on ${projectNameById.get(a.projectId) ?? "a project"}`,
      m: `₹${(a.suggestedCost / 1000).toFixed(1)}k impact · ${a.additionalHours}h additional`,
      time: a.createdAt,
      unread: true,
    })),
    ...emails.map((e) => ({
      id: `email-${e.id}`,
      icon: Mail,
      tone: "muted" as const,
      t: `New email from ${e.from}`,
      m: `${projectNameById.get(e.projectId) ?? "Unknown project"} · ${e.subject}`,
      time: e.receivedAt,
      unread: e.unread,
    })),
    ...projects
      .filter((p) => p.status === "completed")
      .map((p) => ({
        id: `project-${p.id}`,
        icon: FileText,
        tone: "muted" as const,
        t: `${p.name} marked completed`,
        m: `₹${(p.budget / 1000).toFixed(1)}k final`,
        time: p.updatedAt,
      })),
  ];

  return (
    <AppShell title="Notifications" subtitle="What's changed across your workspace.">
      <div className="panel divide-y divide-border overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
            <Bell className="h-7 w-7 text-muted-foreground/40" />
            <div className="text-[13px] text-muted-foreground">No notifications yet</div>
          </div>
        ) : (
          items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.id} className="flex gap-4 px-5 py-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    it.tone === "primary"
                      ? "bg-primary/15 text-primary"
                      : it.tone === "success"
                        ? "bg-[color-mix(in_oklab,var(--success)_16%,transparent)] text-[color:var(--success)]"
                        : "bg-accent text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[13px] font-medium">{it.t}</div>
                    <div className="text-[11px] text-muted-foreground">{it.time}</div>
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{it.m}</div>
                </div>
                {it.unread && <div className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />}
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
