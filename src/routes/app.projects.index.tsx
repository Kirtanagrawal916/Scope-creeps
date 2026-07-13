import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Filter, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill, RiskChip } from "@/components/status-pill";
import { projects } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/projects/")({
  component: ProjectsPage,
  head: () => ({ meta: [{ title: "Projects — ScopeGuard" }] }),
});

function ProjectsPage() {
  return (
    <AppShell title="Projects" subtitle="Every engagement, one source of truth.">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects, clients…" className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Status
        </Button>
        <Button variant="outline" size="sm">
          Client
        </Button>
        <Button variant="outline" size="sm">
          Risk
        </Button>
      </div>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border bg-background/40 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <div>Project</div>
          <div>Budget</div>
          <div>Hours</div>
          <div>Risk</div>
          <div>Status</div>
          <div />
        </div>
        <div className="divide-y divide-border">
          {projects.map((p) => (
            <Link
              key={p.id}
              to="/app/projects/$id"
              params={{ id: p.id }}
              className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5 md:grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-[11px] font-medium">
                  {p.clientInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{p.name}</div>
                  <div className="truncate text-[12px] text-muted-foreground">{p.client}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] md:contents">
                <div className="text-[13px] tabular-nums">
                  <span className="text-muted-foreground md:hidden">Budget: </span>$
                  {p.budget.toLocaleString()}
                </div>
                <div className="text-[13px] tabular-nums text-muted-foreground">
                  {p.hoursUsed}h{" "}
                  <span className="text-muted-foreground/60">/ {p.hoursAllocated}h</span>
                </div>
                <div>
                  <RiskChip level={p.risk} />
                </div>
                <div>
                  <StatusPill status={p.status} />
                </div>
                <ArrowUpRight className="hidden h-4 w-4 text-muted-foreground md:block" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
