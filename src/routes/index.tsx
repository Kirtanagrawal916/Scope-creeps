import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Shield,
  Sparkles,
  Mail,
  FileText,
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Star,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "ScopeGuard — AI change management for freelancers" },
      { property: "og:title", content: "ScopeGuard — AI change management for freelancers" },
    ],
  }),
});

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Start free</Link>
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
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Now with GPT-4-class reasoning on every email</span>
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
          ScopeGuard reads every client email against your contract, flags what's out of scope,
          estimates the cost and timeline impact, and drafts the reply — so you protect revenue
          without becoming the bad guy.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" className="gap-1.5" asChild>
            <Link to="/register">
              Start free — no card required <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/app">See a live demo</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
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
                  Client email · Priya Shah
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4 text-[13px] leading-relaxed text-muted-foreground">
                  "Loving the storefront work. Quick one — can we also ship a native iOS app for
                  launch, and sync inventory with NetSuite? Still hitting the March 14 date, right?"
                </div>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  ScopeGuard is analyzing against Atlas Commerce SOW…
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--destructive)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--destructive)]" />
                    Out of scope
                  </span>
                  <span className="text-[11px] text-muted-foreground">94% confidence</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Extra hours", v: "168h" },
                    { l: "Timeline", v: "+21d" },
                    { l: "Suggested", v: "$22.4k" },
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
                  {[
                    "Native iOS app (browse, cart, checkout)",
                    "Push notifications for orders",
                    "NetSuite inventory sync",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-x-10 -bottom-10 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}

function LogoRow() {
  const logos = ["Atlas", "North Star", "Helix", "Orbit", "Vanta", "Kestrel"];
  return (
    <section className="border-y border-border/60 bg-background/60 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center text-[12px] uppercase tracking-wider text-muted-foreground">
          Trusted by 2,400+ independent studios and consultancies
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-70">
          {logos.map((l) => (
            <span key={l} className="text-[15px] font-semibold tracking-tight text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-16 md:grid-cols-2 md:items-center">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
            The problem
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
            "It's just one small thing" — the four words that cost freelancers $34k a year.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Every consultant knows the pattern. A client asks for "a tiny addition." You say yes.
            Six weeks later you're 60 hours over budget, missing your launch date, and afraid to
            bring up money.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            { k: "$34,200", v: "Median annual revenue lost to scope creep per freelancer" },
            { k: "68%", v: "Of projects go over budget because of unbilled change requests" },
            { k: "4.2h", v: "Average time spent per week diffing emails against SOWs" },
          ].map((s) => (
            <div key={s.k} className="panel p-5">
              <div className="font-display text-3xl font-semibold text-foreground">{s.k}</div>
              <div className="mt-1 text-[13px] text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    icon: FileText,
    title: "Upload your contract",
    body: "Drag in a PDF, DOCX, or paste your SOW. ScopeGuard extracts scope, exclusions, timeline, and rates.",
  },
  {
    n: "02",
    icon: Mail,
    title: "Connect your inbox",
    body: "Forward client threads or connect Gmail. Every new message is analyzed in seconds.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "AI flags scope creep",
    body: "Each request is scored: in scope, out of scope, or mixed — with reasoning and confidence.",
  },
  {
    n: "04",
    icon: Zap,
    title: "You review, then send",
    body: "ScopeGuard drafts a professional change-order reply. You approve, edit, and send in one click.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
          How it works
        </div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Four steps from inbox to invoice.
        </h2>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="panel p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{s.n}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

const features = [
  {
    icon: Shield,
    title: "Contract-aware analysis",
    body: "Not keyword matching. ScopeGuard reads your actual SOW clauses and reasons against them.",
  },
  {
    icon: DollarSign,
    title: "Cost & hour estimates",
    body: "Every out-of-scope request comes with a defensible dollar figure and hour estimate.",
  },
  {
    icon: Clock,
    title: "Timeline impact",
    body: "Know exactly how many days a change adds — before you commit to it in an email.",
  },
  {
    icon: Mail,
    title: "Draft replies you'd actually send",
    body: "Firm but warm. No corporate stiffness, no jargon. Editable in one click.",
  },
  {
    icon: BarChart3,
    title: "Revenue protected dashboard",
    body: "See how much money ScopeGuard has saved you — quarter over quarter.",
  },
  {
    icon: Users,
    title: "Built for teams",
    body: "Studios and agencies can share workspaces, contracts, and approval workflows.",
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
            Enterprise intelligence, freelancer simplicity.
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="panel p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-foreground">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FutureOfWork() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="panel relative overflow-hidden p-10 md:p-14">
        <div className="absolute inset-0 bg-radial-glow opacity-70" />
        <div className="relative grid gap-10 md:grid-cols-[1.3fr_1fr] md:items-center">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
              The future of work
            </div>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
              Independent, but not alone.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              By 2027, over half of the U.S. workforce will be independent. ScopeGuard is the
              operating layer for that shift — the same commercial defense in-house counsel gives
              enterprises, delivered to every freelancer's inbox.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "$148k", v: "Revenue protected / user / year" },
              { k: "312h", v: "Hours saved on scope debates" },
              { k: "1,284", v: "Emails analyzed monthly" },
              { k: "94%", v: "Analyses accepted without edits" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-background/50 p-4">
                <div className="font-display text-2xl font-semibold text-foreground">{s.k}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "ScopeGuard paid for itself in the first week. Caught a $14k Figma-plus-Webflow addition disguised as 'a quick tweak'.",
    name: "Maya Ellison",
    role: "Founder, Ellison Studio",
  },
  {
    quote:
      "I stopped dreading client emails. The draft replies are startlingly on-brand and firm without being cold.",
    name: "Devon Park",
    role: "Independent iOS engineer",
  },
  {
    quote:
      "As a five-person agency this is basically a junior producer that never sleeps. We ship change orders same-day now.",
    name: "Sarah Okafor",
    role: "COO, Fieldnote",
  },
];

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.name} className="panel p-6">
            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-foreground">"{t.quote}"</p>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-medium">
                {t.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")}
              </div>
              <div>
                <div className="text-[13px] font-medium">{t.name}</div>
                <div className="text-[12px] text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Solo",
    price: "$29",
    tag: "For freelancers",
    features: ["3 active projects", "200 emails / mo analyzed", "AI drafted replies", "Contract library"],
  },
  {
    name: "Studio",
    price: "$79",
    tag: "Most popular",
    highlight: true,
    features: [
      "Unlimited projects",
      "2,000 emails / mo analyzed",
      "Team workspace (up to 5)",
      "Analytics dashboard",
      "Gmail & Outlook sync",
    ],
  },
  {
    name: "Agency",
    price: "$199",
    tag: "For teams",
    features: [
      "Everything in Studio",
      "Unlimited seats",
      "SSO & audit log",
      "Custom SOW templates",
      "Priority support",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <div className="text-[12px] font-medium uppercase tracking-wider text-primary">Pricing</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Pays for itself in a single change order.
        </h2>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`panel relative p-6 ${
              p.highlight ? "border-primary/40 shadow-[0_0_60px_-30px_var(--primary)]" : ""
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-2.5 left-6 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                {p.tag}
              </div>
            )}
            <div className="text-[12px] text-muted-foreground">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold tracking-tight">{p.price}</span>
              <span className="text-[13px] text-muted-foreground">/ month</span>
            </div>
            <Button
              className="mt-5 w-full"
              variant={p.highlight ? "default" : "outline"}
              asChild
            >
              <Link to="/register">Start 14-day trial</Link>
            </Button>
            <ul className="mt-6 space-y-2.5 text-[13px] text-muted-foreground">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Does ScopeGuard actually send emails on my behalf?",
    a: "Never. ScopeGuard always drafts. You review, edit, and send from your own client-facing inbox.",
  },
  {
    q: "Which email providers do you support?",
    a: "Gmail and Google Workspace today. Outlook and IMAP are in beta. You can also forward threads to a private ScopeGuard inbox.",
  },
  {
    q: "Where does the AI reasoning come from?",
    a: "We use best-in-class language models with your contract loaded as context. Nothing is used to train external models.",
  },
  {
    q: "Is my client data secure?",
    a: "Encrypted at rest and in transit. SOC 2 Type II in progress. You can delete any project's data in one click.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <div className="text-[12px] font-medium uppercase tracking-wider text-primary">FAQ</div>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Questions, answered.
        </h2>
      </div>
      <div className="mt-10 divide-y divide-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-foreground">
              {f.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="panel relative overflow-hidden p-14 text-center">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-foreground">
            Stop absorbing invisible work.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">
            Start free in under a minute. First scope creep detection on us.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">Start free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/app">Explore demo</Link>
            </Button>
          </div>
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
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Changelog</a>
            <a href="#" className="hover:text-foreground">Twitter</a>
          </div>
          <div className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} ScopeGuard, Inc.
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
      <LogoRow />
      <Problem />
      <HowItWorks />
      <Features />
      <FutureOfWork />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
