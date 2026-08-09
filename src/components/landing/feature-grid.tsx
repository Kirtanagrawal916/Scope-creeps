import { motion } from "framer-motion";
import {
  FileText,
  AlertCircle,
  TrendingUp,
  Coins,
  BellRing,
  Download,
  Search,
  FolderKanban,
  History,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Scope Analysis",
    body: "Parse client emails against your original contract to immediately identify un-scoped work.",
  },
  {
    icon: AlertCircle,
    title: "Scope Creep Detection",
    body: "Flags extra features, revisions, and out-of-scope requests before you agree to them.",
  },
  {
    icon: Coins,
    title: "Cost Impact (₹)",
    body: "Quantifies the exact monetary value and hours needed for newly requested features in INR.",
  },
  {
    icon: TrendingUp,
    title: "Project Health Score",
    body: "Calculates real-time project stability and scope volatility based on historical client requests.",
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    body: "Stay updated on pending change decisions, unread alerts, and timeline updates.",
  },
  {
    icon: Download,
    title: "Reports & Exports",
    body: "Export scope change logs and project analysis summaries to PDF, CSV, Excel, and JSON.",
  },
  {
    icon: Search,
    title: "Global Search",
    body: "Instant search across all projects, client email threads, scope analyses, and notifications.",
  },
  {
    icon: FolderKanban,
    title: "Project Workspace Tracking",
    body: "Organize client deliverables, default billing rates, currencies, and project timelines.",
  },
  {
    icon: History,
    title: "Activity Audit Log",
    body: "Complete transparent timeline of scope changes, responses sent, and status updates.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Built for Software Engineers & Agencies
        </p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
          Everything You Need to Protect Your Project Margins.
        </h2>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          ScopeGuard turns unpredictable client requests into clear choices, keeping your codebases
          on schedule and your budgets profitable.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="lift rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">0{index + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
