import { createFileRoute, useRouteContext, useRouter, Link } from "@tanstack/react-router";
import {
  Mail,
  FolderKanban,
  Github,
  CheckCircle2,
  Link2,
  Unlink,
  FileSearch,
  AlertTriangle,
  Coins,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, getGoogleAuthUrl, getGithubAuthUrl, unlinkProvider } from "@/lib/auth";
import { listProjects } from "@/lib/projects.server";
import { listAllUserAnalyses } from "@/lib/analyses.server";
import { formatCurrency } from "@/lib/formatters";
import { StatusPill } from "@/components/status-pill";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/app/profile")({
  loader: async () => {
    try {
      const [projectsRes, analysesRes] = await Promise.all([
        listProjects({ data: { archived: false } }).catch(() => []),
        listAllUserAnalyses().catch(() => []),
      ]);

      const projects = projectsRes || [];
      const analyses = analysesRes || [];

      const activeProjects = projects.filter((p) => !p.archived);
      const outOfScopeAnalyses = analyses.filter((a) => a.verdict === "out_of_scope");
      const totalCostImpact = analyses.reduce((acc, a) => acc + (a.suggestedCost || 0), 0);

      return {
        projects,
        analyses,
        stats: {
          totalProjects: projects.length,
          activeProjects: activeProjects.length,
          totalAnalyses: analyses.length,
          outOfScopeCount: outOfScopeAnalyses.length,
          totalCostImpact,
        },
      };
    } catch (err) {
      console.error("Profile loader error:", err);
      return {
        projects: [],
        analyses: [],
        stats: {
          totalProjects: 0,
          activeProjects: 0,
          totalAnalyses: 0,
          outOfScopeCount: 0,
          totalCostImpact: 0,
        },
      };
    }
  },
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — ScopeGuard" }] }),
});

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  workspaceName?: string;
  avatar?: string;
  googleId?: string;
  githubId?: string;
  githubUsername?: string;
  authMethod?: string[];
  provider?: string;
  currencySymbol?: string;
}

function EditProfileModal({
  user,
  onSuccess,
}: {
  user: UserProfile | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");

    try {
      const response = await updateProfile({
        data: { firstName, lastName },
      });

      if (response.success) {
        onSuccess();
        setOpen(false);
      } else {
        setErrorMessage(response.message || "Failed to update profile.");
      }
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3">
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal details below. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user?.firstName || ""}
                className="col-span-3 bg-background/60"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user?.lastName || ""}
                className="col-span-3 bg-background/60"
              />
            </div>
            {errorMessage && (
              <div className="col-span-4 text-center text-[13px] text-destructive font-medium">
                {errorMessage}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProfilePage() {
  const router = useRouter();
  const { user } = useRouteContext({ from: "/app" }) as { user: UserProfile | null };
  const { projects, analyses, stats } = Route.useLoaderData();
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
    : "U";
  const fullName = user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "User";

  async function handleLinkGoogle() {
    try {
      const response = await getGoogleAuthUrl();
      if (response && response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to initiate Google link.");
    }
  }

  async function handleLinkGithub() {
    try {
      const response = await getGithubAuthUrl();
      if (response && response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to initiate GitHub link.");
    }
  }

  async function handleUnlink(provider: "google" | "github") {
    setUnlinking(provider);
    setAuthError("");
    try {
      const res = await unlinkProvider({ data: { provider } });
      if (res.success) {
        router.invalidate();
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : `Failed to disconnect ${provider}`);
    } finally {
      setUnlinking(null);
    }
  }

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Profile Header */}
        <div className="panel overflow-hidden">
          <div className="h-32 bg-hero-gradient" />
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
            <div className="-mt-10 flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={fullName} />
                ) : (
                  <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{fullName}</h1>
                <div className="mt-1 text-[13px] text-muted-foreground flex items-center gap-2">
                  <span>Workspace Owner</span> ·
                  <span className="font-medium text-foreground">
                    {user?.workspaceName || "Workspace"}
                  </span>
                </div>
              </div>
            </div>
            <EditProfileModal user={user} onSuccess={() => router.invalidate()} />
          </div>

          <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" /> {user?.email || "No email"}
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <FolderKanban className="h-4 w-4 text-primary" /> {stats.activeProjects} Active
              Projects
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <FileSearch className="h-4 w-4 text-primary" /> {stats.totalAnalyses} Scope Analyses
            </div>
          </div>
        </div>

        {/* Real Backend Statistics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Projects</span>
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{stats.totalProjects}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {stats.activeProjects} currently active
            </p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Scope Creep Flagged</span>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-destructive">
              {stats.outOfScopeCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">out-of-scope requests</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Cost Impact (₹)</span>
              <Coins className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalCostImpact, user?.currencySymbol || "₹")}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">quantified extra revenue</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Analyses</span>
              <FileSearch className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{stats.totalAnalyses}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">email requests scanned</p>
          </div>
        </div>

        {/* Recent Projects & Recent Analyses */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Projects */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold">Active Projects</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
                <Link to="/app/projects">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No active projects found.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {projects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to="/app/projects/$id"
                    params={{ id: p.id }}
                    className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.client || "Client"}</div>
                    </div>
                    <StatusPill status={p.status || "on_track"} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Scope Analyses */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold">Recent Analyses</h2>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" asChild>
                <Link to="/app/history">
                  History <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>

            {analyses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No scope analyses run yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {analyses.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to="/app/analysis/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="max-w-[200px] truncate">
                      <div className="font-medium text-sm text-foreground truncate">
                        {a.aiSummary || a.originalRequirement || "Scope Analysis"}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {a.riskLevel ? `${a.riskLevel.toUpperCase()} RISK` : "Analysis"}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        a.verdict === "out_of_scope" ? "text-destructive" : "text-emerald-500"
                      }`}
                    >
                      {a.verdict === "out_of_scope" && a.suggestedCost
                        ? `+${formatCurrency(a.suggestedCost, "₹")}`
                        : "In Scope"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Connected OAuth Providers */}
        <div className="panel p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Connected Accounts</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage single sign-on providers linked to your ScopeGuard account.
          </p>

          {authError && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive font-medium">
              {authError}
            </div>
          )}

          <div className="mt-6 divide-y divide-border">
            {/* Google */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-medium">
                    Google
                    {user?.googleId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Not connected
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {user?.googleId
                      ? "Linked for single sign-on"
                      : "Sign in using Google Workspace or Gmail"}
                  </div>
                </div>
              </div>
              {user?.googleId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink("google")}
                  disabled={unlinking === "google"}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  {unlinking === "google" ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLinkGoogle}>
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Connect
                </Button>
              )}
            </div>

            {/* GitHub */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60">
                  <Github className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-medium">
                    GitHub
                    {user?.githubId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Not connected
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {user?.githubUsername
                      ? `@${user.githubUsername} linked for single sign-on`
                      : user?.githubId
                        ? "Linked for single sign-on"
                        : "Sign in using your GitHub account"}
                  </div>
                </div>
              </div>
              {user?.githubId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink("github")}
                  disabled={unlinking === "github"}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Unlink className="mr-1.5 h-3.5 w-3.5" />
                  {unlinking === "github" ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleLinkGithub}>
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
