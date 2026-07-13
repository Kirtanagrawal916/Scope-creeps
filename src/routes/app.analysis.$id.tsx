import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Clock,
  Calendar,
  DollarSign,
  Edit3,
  Send,
  Copy,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { findAnalysis, findEmail, findProject } from "@/lib/mock-data";

export const Route = createFileRoute("/app/analysis/$id")({
  loader: ({ params }) => {
    const analysis = findAnalysis(params.id);
    if (!analysis) throw notFound();
    const project = findProject(analysis.projectId);
    const email = findEmail(analysis.emailId);
    if (!project || !email) throw notFound();
    return { analysis, project, email };
  },
  head: () => ({ meta: [{ title: "AI Analysis — ScopeGuard" }] }),
  component: AnalysisPage,
});

function ConfidenceRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          stroke="var(--primary)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(value / 100) * c} ${c}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="text-center">
        <div className="font-display text-xl font-semibold tabular-nums">{value}%</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
      </div>
    </div>
  );
}

function AnalysisPage() {
  const { analysis, project, email } = Route.useLoaderData();
  const [reply, setReply] = useState(analysis.suggestedReply);
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <AppShell>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link to="/app/projects/$id" params={{ id: project.id }}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {project.name}
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--destructive)]">
                <ShieldAlert className="h-3 w-3" />
                Scope creep detected
              </span>
              <span className="text-[11px] text-muted-foreground">
                Analyzed {analysis.createdAt}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {email.subject}
            </h1>
            <div className="mt-1 text-[13px] text-muted-foreground">
              From {email.from} · {project.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-run
          </Button>
        </div>
      </motion.div>

      {/* Estimate cards */}
      <div className="mt-8 grid gap-3 md:grid-cols-4">
        {[
          {
            l: "Additional hours",
            v: `+${analysis.additionalHours}h`,
            icon: Clock,
            sub: `at $150 / hour`,
          },
          {
            l: "Timeline impact",
            v: `+${analysis.timelineImpactDays} days`,
            icon: Calendar,
            sub: `Ships Apr 4 instead of Mar 14`,
          },
          {
            l: "Suggested cost",
            v: `$${analysis.suggestedCost.toLocaleString()}`,
            icon: DollarSign,
            sub: `Change order value`,
          },
          {
            l: "Confidence",
            v: `${analysis.confidence}%`,
            icon: Sparkles,
            sub: `High — based on §4.2, §4.5`,
          },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="panel p-5"
            >
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {s.l}
              </div>
              <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums">
                {s.v}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{s.sub}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Left column: reasoning + email */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="panel p-6"
          >
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Scope breakdown
              </div>
              <ConfidenceRing value={analysis.confidence} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--success)]">
                  <Check className="h-3.5 w-3.5" /> Included in SOW
                </div>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {analysis.includedFeatures.map((f: string) => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--success)]" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--destructive)]">
                  <X className="h-3.5 w-3.5" /> Out of scope
                </div>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {analysis.outOfScopeFeatures.map((f: string) => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--destructive)]" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="panel p-6"
          >
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              AI reasoning
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-foreground">{analysis.reasoning}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="panel p-6"
          >
            <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Original email
            </div>
            <div className="mt-3 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-medium">
                {email.fromInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{email.from}</div>
                <div className="text-[12px] text-muted-foreground">{email.subject}</div>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                  {email.body}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column: suggested reply */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel sticky top-24 h-fit p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Suggested reply
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigator.clipboard?.writeText(reply)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditing((e) => !e)}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-[12px]">
            <div className="flex gap-2 text-muted-foreground">
              <span className="w-10 shrink-0">To</span>
              <span className="text-foreground">{email.from} &lt;priya@atlas-retail.com&gt;</span>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <span className="w-10 shrink-0">Subject</span>
              <span className="text-foreground">Re: {email.subject}</span>
            </div>
          </div>

          <div className="mt-4">
            {editing ? (
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={14}
                className="font-sans text-[13px] leading-relaxed"
              />
            ) : (
              <div className="rounded-xl border border-border bg-background/40 p-4 text-[13px] leading-relaxed text-foreground whitespace-pre-line">
                {reply}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button className="flex-1 min-w-32" onClick={() => setSent(true)} disabled={sent}>
              {sent ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Sent
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Approve & send
                </>
              )}
            </Button>
            <Button variant="outline">Save as draft</Button>
          </div>

          <div className="mt-4 rounded-lg border border-border/60 bg-background/30 px-3 py-2 text-[11px] text-muted-foreground">
            You always review before sending. ScopeGuard never emails clients on your behalf.
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
