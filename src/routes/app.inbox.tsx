import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Filter, Mail } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RiskChip } from "@/components/status-pill";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { emails, findProject, analysisForEmail } from "@/lib/mock-data";

export const Route = createFileRoute("/app/inbox")({
  component: InboxPage,
  head: () => ({ meta: [{ title: "Email monitoring — ScopeGuard" }] }),
});

function InboxPage() {
  return (
    <AppShell
      title="Email monitoring"
      subtitle="Every client message, scored against its contract."
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search emails, senders…" className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-1.5 h-3.5 w-3.5" /> Risk
        </Button>
        <Button variant="outline" size="sm">
          Project
        </Button>
      </div>
      <div className="panel divide-y divide-border overflow-hidden">
        {emails.map((e) => {
          const project = findProject(e.projectId);
          const analysis = analysisForEmail(e.id);
          const href = analysis
            ? { to: "/app/analysis/$id" as const, params: { id: analysis.id } }
            : { to: "/app/projects/$id" as const, params: { id: e.projectId } };
          return (
            <Link
              key={e.id}
              {...href}
              className="flex items-start gap-4 px-5 py-4 hover:bg-accent/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium">
                {e.fromInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[13px] font-medium">{e.from}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      · {project?.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{e.receivedAt}</span>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-foreground">{e.subject}</div>
                <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{e.preview}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RiskChip level={e.risk} />
                {analysis ? (
                  <span className="text-[10px] text-primary">Analyzed</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Queued</span>
                )}
              </div>
            </Link>
          );
        })}
        <div className="flex items-center justify-center gap-2 px-5 py-8 text-[13px] text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Connect Gmail to auto-import new client threads.
          <Button variant="outline" size="sm">
            Connect Gmail
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
