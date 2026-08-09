import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-sidebar-primary">
            <Zap className="h-3.5 w-3.5" /> Scope Intelligence for Software Teams
          </div>

          <h1 className="mt-6 max-w-[14ch] text-balance font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Stop Scope Creep Before It Eats Your Profit.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-sidebar-foreground/75 sm:text-lg">
            ScopeGuard analyzes client email requests against your original contract, quantifies the
            cost and timeline impact in <strong>INR (₹)</strong>, and drafts a calm, professional
            response before you send.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="group gap-2 bg-sidebar-primary text-sidebar-primary-foreground shadow-lg transition-transform duration-300 hover:-translate-y-0.5 hover:bg-sidebar-primary/90"
              asChild
            >
              <Link to="/register">
                Start Free Workspace
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-5 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sidebar-primary" /> Contract-Aware AI
            </span>
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-sidebar-primary" /> Instant Impact Estimates
            </span>
          </div>
        </motion.div>

        {/* Product Interactive Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
