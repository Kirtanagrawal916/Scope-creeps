export type ProjectStatus = "on_track" | "at_risk" | "scope_creep" | "completed";
export type RiskLevel = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  client: string;
  clientInitials: string;
  budget: number;
  hoursAllocated: number;
  hoursUsed: number;
  progress: number;
  status: ProjectStatus;
  risk: RiskLevel;
  updatedAt: string;
  contract: string;
  scopeItems: string[];
  outOfScope: string[];
}

export interface EmailThread {
  id: string;
  projectId: string;
  from: string;
  fromInitials: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  analyzed: boolean;
  risk: RiskLevel;
  unread?: boolean;
}

export interface Analysis {
  id: string;
  projectId: string;
  emailId: string;
  createdAt: string;
  verdict: "in_scope" | "out_of_scope" | "mixed";
  confidence: number;
  additionalHours: number;
  timelineImpactDays: number;
  suggestedCost: number;
  includedFeatures: string[];
  outOfScopeFeatures: string[];
  reasoning: string;
  suggestedReply: string;
}

export const projects: Project[] = [
  {
    id: "atlas-commerce",
    name: "Atlas Commerce Platform",
    client: "Atlas Retail Group",
    clientInitials: "AR",
    budget: 48000,
    hoursAllocated: 320,
    hoursUsed: 214,
    progress: 67,
    status: "at_risk",
    risk: "high",
    updatedAt: "2 hours ago",
    contract:
      "Design and development of a headless commerce storefront including product catalog, cart, checkout, and Stripe integration. Excludes: native mobile apps, third-party ERP integrations, custom CMS.",
    scopeItems: [
      "Storefront (Next.js + Shopify Hydrogen)",
      "Product catalog with filtering",
      "Cart & Stripe checkout",
      "Account dashboard",
      "Basic SEO & analytics setup",
    ],
    outOfScope: [
      "Native iOS / Android apps",
      "SAP / NetSuite integration",
      "Custom headless CMS",
      "Multi-currency & tax engine",
    ],
  },
  {
    id: "north-star-brand",
    name: "North Star Rebrand",
    client: "North Star Labs",
    clientInitials: "NS",
    budget: 22500,
    hoursAllocated: 180,
    hoursUsed: 96,
    progress: 53,
    status: "on_track",
    risk: "low",
    updatedAt: "yesterday",
    contract:
      "Brand identity system: logo, typography, color, 40-page brand guidelines, and marketing site homepage template.",
    scopeItems: ["Logo suite", "Type system", "Brand guidelines PDF", "Homepage Figma"],
    outOfScope: ["Full marketing website build", "Motion / video assets"],
  },
  {
    id: "helix-ai",
    name: "Helix AI Onboarding",
    client: "Helix Health",
    clientInitials: "HH",
    budget: 36000,
    hoursAllocated: 240,
    hoursUsed: 118,
    progress: 49,
    status: "scope_creep",
    risk: "high",
    updatedAt: "3 hours ago",
    contract:
      "AI-powered onboarding flow for clinician portal. Includes 6 screens, LLM prompt design, and analytics events.",
    scopeItems: ["6 onboarding screens", "Prompt engineering", "Segment analytics"],
    outOfScope: ["HIPAA compliance audit", "EMR integrations", "Voice input"],
  },
  {
    id: "orbit-mobile",
    name: "Orbit iOS App v2",
    client: "Orbit Travel",
    clientInitials: "OT",
    budget: 58000,
    hoursAllocated: 400,
    hoursUsed: 388,
    progress: 92,
    status: "on_track",
    risk: "medium",
    updatedAt: "1 day ago",
    contract: "Rebuild of Orbit iOS app in SwiftUI with new booking flow and loyalty program.",
    scopeItems: ["SwiftUI rebuild", "Booking flow", "Loyalty module"],
    outOfScope: ["Android version", "Backend rewrite"],
  },
  {
    id: "vanta-dashboard",
    name: "Vanta Ops Dashboard",
    client: "Vanta Logistics",
    clientInitials: "VL",
    budget: 41000,
    hoursAllocated: 260,
    hoursUsed: 260,
    progress: 100,
    status: "completed",
    risk: "low",
    updatedAt: "last week",
    contract: "Internal ops dashboard with fleet tracking and SLA reporting.",
    scopeItems: ["Fleet map", "SLA reports", "Role-based access"],
    outOfScope: ["Mobile app"],
  },
];

export const emails: EmailThread[] = [
  {
    id: "email-1",
    projectId: "atlas-commerce",
    from: "Priya Shah",
    fromInitials: "PS",
    subject: "Quick addition — can we get an iOS app too?",
    preview:
      "Loving the storefront work. The exec team is asking if we can also ship a native iOS app alongside launch…",
    body: `Hi team,

Loving how the storefront is coming together — the checkout flow feels really tight.

Quick one from our exec review this morning: the leadership team would love to also have a native iOS app ready alongside the web launch. Nothing too crazy, just the browse + cart + checkout experience, and probably push notifications for order updates.

Also, while we're at it, could we hook this into our NetSuite instance so inventory syncs automatically? Should be straightforward.

Ideally we'd still hit the March 14 launch date. Let me know!

Best,
Priya`,
    receivedAt: "2h ago",
    analyzed: true,
    risk: "high",
    unread: true,
  },
  {
    id: "email-2",
    projectId: "helix-ai",
    from: "Dr. Marcus Wen",
    fromInitials: "MW",
    subject: "Voice input for the onboarding?",
    preview:
      "Our clinicians have been asking about dictation for the intake questions. Would love to explore…",
    body: `Hi,\n\nGreat progress on the onboarding. One request from the clinical team: they'd love voice dictation for the intake questions.\n\nCan we get this in before rollout next month?\n\nThanks,\nMarcus`,
    receivedAt: "5h ago",
    analyzed: true,
    risk: "high",
  },
  {
    id: "email-3",
    projectId: "north-star-brand",
    from: "Elena Ortiz",
    fromInitials: "EO",
    subject: "Small tweak to the logo mark",
    preview:
      "Could we try a version where the mark sits slightly higher relative to the wordmark? Tiny thing.",
    body: `Hey — really happy with direction 2. Small ask: could you try a version where the mark sits about 4px higher relative to the wordmark? Just to test balance.\n\nThanks!`,
    receivedAt: "1d ago",
    analyzed: true,
    risk: "low",
  },
  {
    id: "email-4",
    projectId: "orbit-mobile",
    from: "Sam Kobayashi",
    fromInitials: "SK",
    subject: "Loyalty tier icons — final round",
    preview: "Attached the final tier icons. Ready when you are for QA sign-off.",
    body: "Final tier icons attached. Ready for QA.",
    receivedAt: "1d ago",
    analyzed: false,
    risk: "low",
  },
];

export const analyses: Analysis[] = [
  {
    id: "an-1",
    projectId: "atlas-commerce",
    emailId: "email-1",
    createdAt: "2h ago",
    verdict: "out_of_scope",
    confidence: 94,
    additionalHours: 168,
    timelineImpactDays: 21,
    suggestedCost: 22400,
    includedFeatures: ["Web checkout (already in contract)"],
    outOfScopeFeatures: [
      "Native iOS app (browse + cart + checkout)",
      "Push notifications for order updates",
      "NetSuite inventory sync",
    ],
    reasoning:
      "The original SOW explicitly excludes native mobile applications and third-party ERP integrations (see §4.2 and §4.5). The request adds two distinct workstreams: an iOS build (~120h) and a NetSuite integration (~48h). Delivering both by March 14 is not feasible without extending scope, timeline, and budget.",
    suggestedReply: `Hi Priya,

Thanks — glad the storefront is landing well.

Both the native iOS app and NetSuite sync fall outside our current statement of work (§4.2 and §4.5 of the contract). I'm happy to take them on, but I want to be upfront about what it means for scope so nothing surprises you closer to launch:

• Native iOS app (browse, cart, checkout, push): ~120 hours
• NetSuite inventory sync: ~48 hours
• Combined budget impact: ~$22,400
• Timeline: adds approximately 3 weeks — the March 14 launch would move to April 4

If you'd like, I can put together a short change order covering both, or we can phase the iOS app as a v1.1 after the web launch so you still hit March 14. Let me know what works best on your side and I'll get it moving today.

Best,
Alex`,
  },
];

export const kpis = {
  revenueProtected: 148200,
  hoursSaved: 312,
  emailsAnalyzed: 1284,
  activeAlerts: 7,
};

export const activity = [
  { id: 1, type: "analysis", text: "Scope creep detected on Atlas Commerce", meta: "$22.4k impact", time: "2h ago" },
  { id: 2, type: "email", text: "New client email from Dr. Marcus Wen", meta: "Helix AI Onboarding", time: "5h ago" },
  { id: 3, type: "reply", text: "Change order reply sent to Priya Shah", meta: "Atlas Commerce", time: "yesterday" },
  { id: 4, type: "project", text: "Vanta Ops Dashboard marked as completed", meta: "$41k final", time: "3d ago" },
  { id: 5, type: "analysis", text: "Voice input flagged as out of scope", meta: "Helix AI Onboarding", time: "5h ago" },
];

export const revenueChart = [
  { month: "Jul", protected: 8200, invoiced: 24000 },
  { month: "Aug", protected: 12400, invoiced: 28000 },
  { month: "Sep", protected: 18900, invoiced: 32000 },
  { month: "Oct", protected: 15200, invoiced: 30000 },
  { month: "Nov", protected: 22100, invoiced: 36000 },
  { month: "Dec", protected: 28400, invoiced: 41000 },
  { month: "Jan", protected: 43000, invoiced: 48000 },
];

export const riskDistribution = [
  { name: "In scope", value: 62, color: "var(--success)" },
  { name: "Minor scope creep", value: 24, color: "var(--warning)" },
  { name: "Major scope creep", value: 14, color: "var(--destructive)" },
];

export const scopeTrend = [
  { week: "W1", detected: 2 },
  { week: "W2", detected: 4 },
  { week: "W3", detected: 3 },
  { week: "W4", detected: 6 },
  { week: "W5", detected: 5 },
  { week: "W6", detected: 8 },
  { week: "W7", detected: 7 },
  { week: "W8", detected: 11 },
];

export function findProject(id: string) {
  return projects.find((p) => p.id === id);
}
export function findEmail(id: string) {
  return emails.find((e) => e.id === id);
}
export function findAnalysis(id: string) {
  return analyses.find((a) => a.id === id);
}
export function analysisForEmail(emailId: string) {
  return analyses.find((a) => a.emailId === emailId);
}
export function emailsForProject(projectId: string) {
  return emails.filter((e) => e.projectId === projectId);
}
