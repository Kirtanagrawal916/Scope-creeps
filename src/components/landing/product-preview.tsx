import { motion } from "framer-motion";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

export function ProductPreview() {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl border border-sidebar-border bg-sidebar-accent/30 p-5 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-sidebar-border/70 pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Scope Review / Project Atlas
        </span>
        <StatusPill status="scope_creep" />
      </div>

      {/* Main Content */}
      <div className="pt-4 space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Client Request (Email)
          </span>
          <p className="mt-1.5 font-sans text-lg font-medium leading-snug text-sidebar-foreground">
            &ldquo;Can we also add a native mobile app and real-time inventory sync before launch
            next week?&rdquo;
          </p>
        </div>

        {/* Impact Grid */}
        <div className="grid grid-cols-2 gap-3 border-y border-sidebar-border/60 py-3.5">
          <div className="rounded-lg bg-sidebar/50 p-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
              Estimated Cost
            </span>
            <p className="mt-1 font-display text-xl font-bold text-destructive">+ ₹45,000</p>
          </div>
          <div className="rounded-lg bg-sidebar/50 p-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
              Timeline Impact
            </span>
            <p className="mt-1 font-display text-xl font-bold text-sidebar-foreground flex items-center gap-1">
              <Clock className="h-4 w-4 text-warning" /> +14 Days
            </p>
          </div>
        </div>

        {/* AI Suggested Reply */}
        <div className="rounded-xl border border-sidebar-primary/30 bg-sidebar-primary/10 p-3.5 text-xs text-sidebar-primary-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-sidebar-primary">
            <Sparkles className="h-3.5 w-3.5" /> ScopeGuard AI Recommendation
          </div>
          <p className="mt-1.5 text-sidebar-foreground/90 leading-relaxed">
            &ldquo;Happy to build the inventory sync and mobile app as Phase 2. The estimated cost
            is ₹45,000 with a 14-day timeline extension.&rdquo;
          </p>
        </div>
      </div>

      {/* Floating Badge */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-4 -right-2 flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-lg text-xs font-medium text-foreground"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span>14 hrs saved on revision calls</span>
      </motion.div>
    </motion.div>
  );
}
