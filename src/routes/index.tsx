import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Clock, FileText, Mail, Shield, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "ScopeGuard - AI change management for freelancers" },
      { property: "og:title", content: "ScopeGuard - AI change management for freelancers" },
    ],
  }),
});

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#demo" className="hover:text-foreground">
            Demo
          </a>
          <a href="#contact" className="hover:text-foreground">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" compact />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <a href="#contact">Contact us</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full border border-primary/20"
        animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          <span>AI review for client change requests</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-gradient md:text-6xl"
        >
          Scope creep, caught before you say yes.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground"
        >
          ScopeGuard compares client emails against your contract, flags out-of-scope work,
          estimates timeline impact, and drafts a clear reply for review.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" className="gap-1.5" asChild>
            <a href="#demo">
              View demo <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#contact">Contact us</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Shield,
    title: "Contract-aware analysis",
    body: "Reads your statement of work and compares each new request to agreed scope.",
  },
  {
    icon: Clock,
    title: "Timeline impact",
    body: "Shows how a request may change delivery dates before you reply.",
  },
  {
    icon: FileText,
    title: "Change request summary",
    body: "Turns scattered email threads into a concise scope, risk, and next-step brief.",
  },
  {
    icon: Mail,
    title: "Draft replies",
    body: "Creates editable client responses that explain the change clearly and professionally.",
  },
  {
    icon: BarChart3,
    title: "Project visibility",
    body: "Tracks flagged requests and accepted changes across active projects.",
  },
  {
    icon: Zap,
    title: "Fast review flow",
    body: "Keeps the final decision with you while speeding up the analysis work.",
  },
];

function Features() {
  return (
    <section id="features" className="border-y border-border/60 bg-background/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
            Features
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            A focused review workflow for client changes.
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="panel group p-6"
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  return (
    <section id="demo" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wider text-primary">Demo</div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            See how a request is reviewed.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            The demo workspace shows how ScopeGuard reads an email, identifies new work, and
            prepares a response for approval.
          </p>
          <Button className="mt-6 gap-1.5" asChild>
            <Link to="/app">
              Open demo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-border bg-background/40 px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <div className="ml-3 text-[11px] text-muted-foreground">scopeguard.app / analysis</div>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4 text-left">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Client email
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 text-[13px] leading-relaxed text-muted-foreground">
                "Can we add a native mobile app and sync inventory before launch?"
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Analyzing against the project scope...
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--destructive)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--destructive)]" />
                  Out of scope
                </span>
                <span className="text-[11px] text-muted-foreground">High confidence</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "Extra hours", v: "168h" },
                  { l: "Timeline", v: "+21d" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-card p-2.5">
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                    <div className="mt-0.5 font-display text-[15px] font-semibold tabular-nums">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-1">
                {["Native mobile app", "Inventory integration", "Launch-date risk"].map((f) => (
                  <div key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-y border-border/60 bg-background/60 py-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1fr_0.8fr] md:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
            Contact
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            Bring ScopeGuard to your next client project.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Send a note with your workflow, contract format, and the kind of change requests you
            need reviewed.
          </p>
        </div>
        <div className="panel p-6">
          <div className="text-[13px] font-medium text-foreground">Contact the team</div>
          <a
            href="mailto:hello@scopeguard.app"
            className="mt-3 flex items-center gap-2 text-[15px] text-primary hover:text-primary/80"
          >
            <Mail className="h-4 w-4" />
            hello@scopeguard.app
          </a>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
            We will reply with a demo walkthrough and setup questions.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground">
              Demo
            </a>
            <a href="#contact" className="hover:text-foreground">
              Contact
            </a>
          </div>
          <div className="text-[12px] text-muted-foreground">
            Copyright {new Date().getFullYear()} ScopeGuard.
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Features />
      <Demo />
      <Contact />
      <Footer />
    </div>
  );
}
