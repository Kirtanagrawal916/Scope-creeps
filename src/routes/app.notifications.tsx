import { createFileRoute } from "@tanstack/react-router";
import { Bell, Sparkles, Mail, ArrowUpRight, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — ScopeGuard" }] }),
});

const items = [
  {
    icon: Sparkles,
    tone: "primary",
    t: "Scope creep detected on Atlas Commerce",
    m: "₹22.4k impact · Priya Shah requested iOS + NetSuite",
    time: "2h ago",
    unread: true,
  },
  {
    icon: Mail,
    tone: "muted",
    t: "New email from Dr. Marcus Wen",
    m: "Helix AI Onboarding · voice input request",
    time: "5h ago",
    unread: true,
  },
  {
    icon: ArrowUpRight,
    tone: "success",
    t: "Change order reply approved by client",
    m: "Atlas Commerce · Priya accepted +₹22.4k",
    time: "yesterday",
  },
  {
    icon: FileText,
    tone: "muted",
    t: "Vanta Ops Dashboard marked completed",
    m: "₹41k final invoice generated",
    time: "3d ago",
  },
  {
    icon: Bell,
    tone: "muted",
    t: "Weekly digest ready",
    m: "3 alerts, ₹43k protected this week",
    time: "1w ago",
  },
];

function NotificationsPage() {
  return (
    <AppShell title="Notifications" subtitle="What's changed across your workspace.">
      <div className="panel divide-y divide-border overflow-hidden">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="flex gap-4 px-5 py-4">
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
        })}
      </div>
    </AppShell>
  );
}
