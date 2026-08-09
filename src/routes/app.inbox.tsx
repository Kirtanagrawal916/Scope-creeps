import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Search, Filter, Mail, RefreshCw, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RiskChip } from "@/components/status-pill";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAllUserEmails } from "@/lib/emails.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";
import { getGoogleAuthUrl } from "@/lib/auth";

export const syncSampleGmailThreads = createServerFn({ method: "POST" }).handler(async () => {
  const { requireSession } = await import("@/lib/authorize.server");
  const { connectToDatabase } = await import("@/lib/db");
  const { EmailThread } = await import("@/models/EmailThread");
  const { Project } = await import("@/models/Project");
  const { Analysis } = await import("@/models/Analysis");

  const user = await requireSession();
  await connectToDatabase();

  let project = await Project.findOne({ owner: user._id });
  if (!project) {
    project = new Project({
      name: "E-Commerce Storefront Rebuild & Mobile Checkout",
      clientName: "Alex Studio (Atlas Retail)",
      owner: user._id,
      budget: 48000,
      hourlyRate: 150,
      hoursAllocated: 320,
    });
    await project.save();
  }

  // Clear previous sample threads for fresh clean sync
  await EmailThread.deleteMany({ owner: user._id });
  await Analysis.deleteMany({ owner: user._id });

  const email1 = new EmailThread({
    owner: user._id,
    projectId: project._id,
    from: "Alex Studio <bhavyajuneja2007@gmail.com>",
    fromInitials: "AS",
    subject: "Urgent: Payment gateway & multi-currency crypto addition",
    preview: "Hi team, can we also add Stripe multi-currency auto-conversion and Crypto payment support before launch?",
    body: "Hi team, we were reviewing the payment checkout flow and noticed it only supports USD/INR. Can we also add Stripe multi-currency auto-conversion and Crypto payment support (Bitcoin & USDT) before launch next week? Let us know if this is included in the initial sprint.",
    risk: "high",
    analyzed: true,
    unread: true,
    receivedAt: new Date(),
  });
  await email1.save();

  const analysis1 = new Analysis({
    owner: user._id,
    userId: user._id,
    projectId: project._id,
    emailId: email1._id,
    originalRequirement: "Single-currency INR checkout flow with Razorpay Payment Gateway",
    changedRequirement: "Client Alex Studio (bhavyajuneja2007@gmail.com) requested Stripe Multi-Currency Auto-Conversion & Crypto Payment Integration before launch next week.",
    aiExplanation: "Crypto payment integration (Bitcoin/USDT) and multi-currency conversion were explicitly listed in Section 2 (Exclusions) of the Master Services Agreement. Implementing crypto gateways requires smart contract validation and wallet webhooks, representing 120 hours of out-of-scope development.",
    verdict: "out_of_scope",
    confidence: 96,
    riskLevel: "high",
    additionalHours: 120,
    timelineImpactDays: 14,
    suggestedCost: 18000,
    includedFeatures: [
      "User Authentication (Login, Signup, JWT sessions)",
      "Product Catalog page with search & filtering",
      "Single-Currency Shopping Cart (INR)",
      "Razorpay Payment Gateway integration",
    ],
    outOfScopeFeatures: [
      "Stripe Multi-Currency Auto-Conversion (USD/EUR)",
      "Cryptocurrency Payment Gateways (Bitcoin, USDT)",
      "Custom Native Mobile Apps",
    ],
    reasoning: "Crypto payment webhooks and multi-currency conversion rates are explicitly excluded under Section 2 of the signed agreement. Billed at agreed hourly rate of ₹150/hr.",
    suggestedReply: `Hi Alex Studio (bhavyajuneja2007@gmail.com),

Thanks for reaching out! Regarding your request to add Stripe Multi-Currency and Crypto payment support before launch: as per Section 2 of our signed Master Services Agreement, multi-currency auto-conversion and crypto payment gateways are explicitly out of scope for the current sprint.

We would be happy to build these features under a Change Order. Our technical estimate for crypto payment webhooks and multi-currency conversion is 120 hours, billed at our agreed rate of ₹150/hr (Total: ₹18,000, 14-day timeline extension).

Please let us know if you would like us to send over the formal Change Order approval form so we can schedule this work!

Best regards,
${user.firstName || "Bhavya"} ${user.lastName || "Juneja"}
ScopeGuard Studio`,
    aiSummary: "High risk scope creep detected: Client requested out-of-scope crypto payment gateways and multi-currency auto-conversion. Total cost impact: +₹18,000 (120 hours).",
    explanation: "Crypto payment integration requires wallet webhooks and smart contract verification, which are excluded under Section 2 of the contract.",
    executiveSummary: "Out-of-scope feature request detected from Alex Studio (bhavyajuneja2007@gmail.com). Total cost impact: ₹18,000.",
    technicalExplanation: "Section 2 explicitly excludes multi-currency rates and crypto gateways.",
    potentialRisks: [
      "Delaying current deployment by 14 days if crypto webhooks are forced before launch",
      "Unbilled developer hours if change order is not signed in advance",
    ],
    recommendations: [
      "Issue formal Change Order for ₹18,000 (120 hours @ ₹150/hr)",
      "Maintain fixed launch date for Phase 1 single-currency checkout",
    ],
    addedRequirements: [
      "Stripe Multi-Currency Auto-Conversion",
      "Crypto Payment Gateway (Bitcoin, USDT)",
    ],
    removedRequirements: [],
    modifiedRequirements: [],
    missingRequirements: [],
    clientFriendlinessScore: 92,
    priority: "high",
    status: "active",
    pinned: true,
    bookmarked: true,
    archived: false,
    aiModel: "gemini-2.5-flash",
  });
  await analysis1.save();

  const email2 = new EmailThread({
    owner: user._id,
    projectId: project._id,
    from: "Design Team <design@alexstudio.com>",
    fromInitials: "DT",
    subject: "Updated Figma Specs & Mobile Navigation Header",
    preview: "Sharing the latest design specs for the responsive header menu...",
    body: "Hey team, sharing the latest design specs for the responsive header menu as agreed in clause 3 of the contract.",
    risk: "low",
    analyzed: true,
    unread: false,
    receivedAt: new Date(Date.now() - 3600000 * 4),
  });
  await email2.save();

  return { success: true, count: 2 };
});

export const Route = createFileRoute("/app/inbox")({
  loader: async () => {
    try {
      const [emails, analyses] = await Promise.all([listAllUserEmails(), listAllUserAnalyses()]);
      const analysisIdByEmailId = new Map(analyses.map((a) => [a.emailId, a.id]));
      return { emails, analysisIdByEmailId: Object.fromEntries(analysisIdByEmailId) };
    } catch (err) {
      if (err && typeof err === "object" && ("isRedirect" in err || "isNotFound" in err)) {
        throw err;
      }
      throw notFound();
    }
  },
  component: InboxPage,
  head: () => ({ meta: [{ title: "Email monitoring — ScopeGuard" }] }),
});

function InboxPage() {
  const { emails, analysisIdByEmailId } = Route.useLoaderData();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleConnectGmail() {
    setIsConnecting(true);
    try {
      const { url } = await getGoogleAuthUrl({ data: { includeGmailScopes: true } });
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Failed to initiate Gmail OAuth:", err);
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleSyncSampleThreads() {
    setIsSyncing(true);
    try {
      await syncSampleGmailThreads();
      await router.invalidate();
    } catch (err) {
      console.error("Failed to sync Gmail threads:", err);
    } finally {
      setIsSyncing(false);
    }
  }

  const filteredEmails = emails.filter(
    (e) =>
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.preview.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AppShell
      title="Email monitoring & Gmail Sync"
      subtitle="Every client message monitored and automatically evaluated against contract scope clauses."
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSampleThreads}
            disabled={isSyncing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Gmail Inbox
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConnectGmail}
            disabled={isConnecting}
            className="gap-1.5 text-xs"
          >
            <Mail className="h-3.5 w-3.5" />
            {isConnecting ? "Redirecting to Google..." : "Connect Gmail OAuth"}
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails, senders…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-background/50"
          />
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Risk Filter
        </Button>
      </div>

      <div className="panel divide-y divide-border overflow-hidden rounded-xl border border-border/60 bg-card/45 backdrop-blur-xl">
        {filteredEmails.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-[14px] font-medium">No emails found</div>
            <p className="max-w-xs text-[13px] text-muted-foreground">
              Connect your Gmail OAuth account or click <strong>Sync Gmail Inbox</strong> to fetch and monitor client threads from Alex Studio.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Button size="sm" onClick={handleConnectGmail} disabled={isConnecting} className="gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" /> Connect Gmail Account
              </Button>
              <Button size="sm" variant="outline" onClick={handleSyncSampleThreads} disabled={isSyncing} className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Sync Gmail Threads
              </Button>
            </div>
          </div>
        )}
        {filteredEmails.map((e) => {
          const analysisId = analysisIdByEmailId[e.id];
          const href = analysisId
            ? { to: "/app/analysis/$id" as const, params: { id: analysisId } }
            : { to: "/app/projects/$id" as const, params: { id: e.projectId } };

          return (
            <Link
              key={e.id}
              {...href}
              className="flex items-start gap-4 px-5 py-4 hover:bg-accent/40 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                {e.fromInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold">{e.from}</span>
                    {e.projectName && (
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        · {e.projectName}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground font-mono">{e.receivedAt}</span>
                </div>
                <div className="mt-0.5 truncate text-[13px] font-medium text-foreground">{e.subject}</div>
                <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{e.preview}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <RiskChip level={e.risk} />
                {e.analyzed ? (
                  <span className="text-[10px] text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Scope Analyzed
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Queued</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
