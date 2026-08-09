import { motion } from "framer-motion";
import { FolderPlus, MailCheck, ShieldAlert, Send } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FolderPlus,
    title: "Add Project & Contract",
    desc: "Import your project details, milestone scope, and default hourly rate in INR (₹).",
  },
  {
    number: "02",
    icon: MailCheck,
    title: "Analyze Client Requests",
    desc: "Paste incoming client emails or messages into ScopeGuard's AI analyzer.",
  },
  {
    number: "03",
    icon: ShieldAlert,
    title: "Quantify Scope & Cost",
    desc: "See out-of-scope flags, estimated cost in ₹, and timeline impact in days.",
  },
  {
    number: "04",
    icon: Send,
    title: "Send Professional Reply",
    desc: "Use AI-generated diplomatic response drafts to protect client trust and your bottom line.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Simple 4-Step Workflow
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            How ScopeGuard Protects Your Time & Budget.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            From raw email request to a structured change order in less than a minute.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-primary">{step.number}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
