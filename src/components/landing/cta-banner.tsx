import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="border-t border-border bg-sidebar text-sidebar-foreground py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-sidebar-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Protect Your Development Revenue
        </div>

        <h2 className="mt-6 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Ready to Eliminate Unpaid Scope Creep?
        </h2>

        <p className="mt-4 mx-auto max-w-xl text-sidebar-foreground/75 text-base leading-relaxed">
          Create your ScopeGuard workspace in less than 2 minutes. Start analyzing client requests,
          protecting deadlines, and getting paid for every hour you scope.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Button
            size="lg"
            className="group gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-lg"
            asChild
          >
            <Link to="/register">
              Create Free Workspace
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
