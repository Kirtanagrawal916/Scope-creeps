import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Key,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// Server function to gather diagnostic health information
const getHealthDiagnostics = createServerFn({ method: "GET" }).handler(async () => {
  let dbConnected = false;
  let dbError = "";

  try {
    const { connectToDatabase } = await import("@/lib/db");
    await connectToDatabase();
    dbConnected = true;
  } catch (err) {
    const error = err as Error;
    dbError = error.message || String(err);
  }

  const memoryUsage = process.memoryUsage();

  return {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    },
    database: {
      connected: dbConnected,
      error: dbError || null,
      uriConfigured: !!process.env.MONGODB_URI,
      overrideDns: process.env.MONGODB_OVERRIDE_DNS === "true",
    },
    jwt: {
      configured: !!process.env.JWT_SECRET,
      secretSource: process.env.JWT_SECRET
        ? "Environment variable (.env)"
        : "Development fallback key",
    },
    oauth: {
      googleConfigured: !!(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.CALLBACK_URL
      ),
      clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
      clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrlPresent: !!process.env.CALLBACK_URL,
    },
  };
});

const checkHealthAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth.server");
  const user = await getSessionUser();
  return { authenticated: user !== null };
});

export const Route = createFileRoute("/health")({
  beforeLoad: async () => {
    const auth = await checkHealthAuth();
    if (!auth.authenticated) {
      throw redirect({
        to: "/login",
        search: {
          error: "You must be logged in to access diagnostics.",
        },
      });
    }
  },
  loader: async () => {
    try {
      return await getHealthDiagnostics();
    } catch (err) {
      console.error("Health diagnostics loader error:", err);
      throw err;
    }
  },
  component: HealthCheckPage,
  head: () => ({ meta: [{ title: "System Health Diagnostics - ScopeGuard" }] }),
});

function HealthCheckPage() {
  const initialDiagnostics = Route.useLoaderData();
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const data = await getHealthDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error("Refresh diagnostics failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }

  const isAllHealthy = diagnostics.database.connected && diagnostics.jwt.configured;

  return (
    <div className="auth-scene relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-700">
      {/* Decorative Atmosphere Background */}
      <div className="absolute inset-0 auth-aurora opacity-70" />
      <div className="absolute inset-0 auth-grid opacity-40" />

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        {/* Navigation / Header */}
        <header className="flex items-center justify-between border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo />
            </Link>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary sm:inline-block">
              Diagnostics
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 bg-background/50 backdrop-blur"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Re-run Diagnostics
            </Button>
          </div>
        </header>

        {/* Dashboard Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/45 p-6 shadow-xl backdrop-blur-xl sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  System Health Check
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Run diagnostics to verify local developer setups, database access, and
                configurations.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-xl border border-border/40 bg-background/45 px-4 py-3 sm:self-center">
              {isAllHealthy ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-warning" />
              )}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Overall Status
                </div>
                <div className="text-sm font-semibold">
                  {isAllHealthy ? "Fully Operational" : "Needs Attention"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Diagnostic Status Cards Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* MongoDB Connectivity Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border/60 bg-card/45 p-6 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">MongoDB Connection</h2>
              </div>
              {diagnostics.database.connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />{" "}
                  Disconnected
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">URI Configured</span>
                <span className="font-semibold">
                  {diagnostics.database.uriConfigured ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">DNS Override Enabled</span>
                <span className="font-semibold">
                  {diagnostics.database.overrideDns ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              {diagnostics.database.error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mt-4">
                  <div className="flex gap-2">
                    <XCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-destructive">Connection Error</h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground font-mono break-all">
                        {diagnostics.database.error}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 border-t border-destructive/10 pt-2.5 text-[11px]">
                    <span className="font-semibold text-foreground">💡 Tip:</span> If you are on a
                    VPN or corporate firewall, ensure `MONGODB_OVERRIDE_DNS=false` is set in your
                    `.env` to prevent public DNS queries from being blocked.
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* JWT & Encryption Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border/60 bg-card/45 p-6 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
                  <Key className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">JWT Signing Configurations</h2>
              </div>
              {diagnostics.jwt.configured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Using Fallback
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">JWT_SECRET Defined</span>
                <span className="font-semibold">
                  {diagnostics.jwt.configured ? "✅ Yes" : "⚠️ No (Fallback)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">Key Origin</span>
                <span className="font-semibold text-muted-foreground text-[11px] truncate max-w-[190px]">
                  {diagnostics.jwt.secretSource}
                </span>
              </div>
              {!diagnostics.jwt.configured && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 mt-4 text-[11px] leading-relaxed">
                  <div className="flex gap-2 text-warning font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Development Default Key Warning</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Using the development fallback key is fine for local developer sandboxes, but a
                    unique secret key must be defined in production. Add
                    `JWT_SECRET=your-random-key` to `.env`.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* System Environment Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border/60 bg-card/45 p-6 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">Process & Node Metrics</h2>
            </div>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">Node Version</span>
                <span className="font-semibold">{diagnostics.nodeVersion}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-semibold capitalize">{diagnostics.platform}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">Process Uptime</span>
                <span className="font-semibold">{diagnostics.uptime} seconds</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">Heap Usage</span>
                <span className="font-semibold">
                  {diagnostics.memory.heapUsed} (RSS: {diagnostics.memory.rss})
                </span>
              </div>
            </div>
          </motion.div>

          {/* Google OAuth Configurations Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border/60 bg-card/45 p-6 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
                  <Globe className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">Google OAuth Status</h2>
              </div>
              {diagnostics.oauth.googleConfigured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" /> Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Disabled
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">GOOGLE_CLIENT_ID Present</span>
                <span className="font-semibold">
                  {diagnostics.oauth.clientIdPresent ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">GOOGLE_CLIENT_SECRET Present</span>
                <span className="font-semibold">
                  {diagnostics.oauth.clientSecretPresent ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2 text-xs">
                <span className="text-muted-foreground">CALLBACK_URL Present</span>
                <span className="font-semibold">
                  {diagnostics.oauth.callbackUrlPresent ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <footer className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          Diagnostics last run at {new Date(diagnostics.timestamp).toLocaleTimeString()} in{" "}
          {diagnostics.env} mode.
        </footer>
      </div>
    </div>
  );
}
