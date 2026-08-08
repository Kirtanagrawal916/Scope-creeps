import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  FileText,
  Mail,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({ meta: [{ title: "ScopeGuard — protect the work you scoped" }] }),
});
const features = [
  {
    icon: FileText,
    title: "Read the agreement",
    body: "Anchor every review in the actual scope, milestones, and boundaries you promised.",
  },
  {
    icon: CircleAlert,
    title: "Spot the delta",
    body: "See the request that moved, the risk it introduces, and the decision waiting on you.",
  },
  {
    icon: Mail,
    title: "Reply with leverage",
    body: "Draft a calm, specific response that protects the relationship and the margin.",
  },
];
function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/">
            <Logo className="[&_span]:text-sidebar-foreground" />
          </Link>
          <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60 md:flex">
            <a href="#method" className="hover:text-sidebar-foreground">
              Method
            </a>
            <a href="#signal" className="hover:text-sidebar-foreground">
              Signal
            </a>
            <a href="#contact" className="hover:text-sidebar-foreground">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:flex" compact />
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              asChild
            >
              <Link to="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              asChild
            >
              <Link to="/register">Create New Workspace</Link>
            </Button>
          </div>
        </div>
      </header>
      <main>
        <section className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 md:grid-cols-[1fr_0.8fr] md:items-center md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-primary">
                Scope intelligence / 01
              </p>
              <h1 className="mt-6 max-w-[12ch] text-balance font-display text-5xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-[7.25rem]">
                The quiet system behind better boundaries.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-sidebar-foreground/65">
                ScopeGuard turns client change requests into visible decisions. Know what moved
                before you promise what&apos;s next.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="group gap-2 bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_18px_36px_-24px_var(--sidebar-primary)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-sidebar-primary/90"
                  asChild
                >
                  <Link to="/register">
                    Create New Workspace
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Button>
                <a
                  href="#method"
                  className="inline-flex items-center border border-sidebar-border px-5 py-3 text-sm text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  See the method
                </a>
              </div>
              <div className="mt-12 flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-sidebar-primary" /> Contract-aware
                </span>
                <span className="flex items-center gap-2">
                  <Timer className="size-4 text-sidebar-primary" /> Minutes, not meetings
                </span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="lift border border-sidebar-border bg-sidebar-accent/30 p-4 shadow-[0_24px_70px_-48px_var(--sidebar-primary)]"
            >
              <div className="flex items-center justify-between border-b border-sidebar-border px-2 pb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">
                <span>Live review / Atlas</span>
                <span className="text-sidebar-primary">Needs decision</span>
              </div>
              <div className="p-3 pt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  Incoming request
                </p>
                <p className="mt-3 text-xl leading-8 text-sidebar-foreground">
                  “Can we also add a mobile app and sync inventory before launch?”
                </p>
                <div className="mt-8 grid grid-cols-2 border-y border-sidebar-border py-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-sidebar-foreground/45">
                      Scope status
                    </p>
                    <p className="mt-2 font-display text-lg text-destructive">Out of scope</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-sidebar-foreground/45">
                      Timeline
                    </p>
                    <p className="mt-2 font-display text-lg">+21 days</p>
                  </div>
                </div>
                <div className="mt-6 bg-sidebar-primary p-4 text-sm leading-6 text-sidebar-primary-foreground">
                  <span className="font-semibold">Suggested next move.</span> Confirm the change
                  estimate and revised launch date before work begins.
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        <section id="method" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              A better operating rhythm
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Make the invisible work legible.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              The best client conversations start before the reply. ScopeGuard gives the request a
              place to land, a consequence to carry, and a response you can stand behind.
            </p>
          </div>
          <div className="mt-14 grid border-y border-border md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -3 }}
                className="lift border-b border-border p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-primary">0{index + 1}</span>
                  <Icon className="size-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mt-12 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>
        <section id="signal" className="border-y border-border bg-accent/35">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-center md:py-24">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                The signal, not the noise
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
                A decision is worth more than another inbox search.
              </h2>
              <Button className="mt-8 gap-2" asChild>
                <Link to="/register">
                  Create New Workspace <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-border bg-card p-5">
                <Zap className="size-5 text-primary" />
                <p className="mt-8 font-display text-3xl font-semibold">48 sec</p>
                <p className="mt-2 text-sm text-muted-foreground">average time to a first draft</p>
              </div>
              <div className="border border-border bg-card p-5">
                <Check className="size-5 text-success" />
                <p className="mt-8 font-display text-3xl font-semibold">1 view</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  for scope, effort, risk, and next step
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer
        id="contact"
        className="border-t border-sidebar-border bg-sidebar px-5 py-8 text-sidebar-foreground sm:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="[&_span]:text-sidebar-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45">
            ScopeGuard / protect the work you scoped
          </span>
        </div>
      </footer>
    </div>
  );
}
