import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser, getGoogleAuthUrl, getGithubAuthUrl } from "@/lib/auth";

const AUTH_TOKEN_KEY = "scopeguard_token";

const featureCards: Array<{
  title: string;
  detail: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Scope risk",
    detail: "3 client threads need review",
    Icon: ShieldCheck,
  },
  {
    title: "Reply speed",
    detail: "Drafted responses in 48 sec",
    Icon: Zap,
  },
];

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { error?: string } => {
    return {
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Log in - ScopeGuard" }] }),
});

function LoginPage() {
  const { error } = Route.useSearch();
  const nav = useNavigate();
  const [message, setMessage] = useState(error || "");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const response = await getGoogleAuthUrl();
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        setMessage("Google login failed to initialize.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      setMessage(err instanceof Error ? err.message : "Google login is currently unavailable.");
      setIsGoogleLoading(false);
    }
  }

  async function handleGithubLogin() {
    setIsGithubLoading(true);
    setMessage("");
    try {
      const response = await getGithubAuthUrl();
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        setMessage("GitHub login failed to initialize.");
        setIsGithubLoading(false);
      }
    } catch (err) {
      console.error("GitHub authentication error:", err);
      setMessage(err instanceof Error ? err.message : "GitHub login is currently unavailable.");
      setIsGithubLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("[DEBUG LOGIN] 1. Login button clicked");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    console.log("[DEBUG LOGIN] 2. Form validation passed for email:", email);

    try {
      console.log("[DEBUG LOGIN] 3. Calling loginUser server function...");
      const response = await loginUser({ data: { email, password } });
      console.log("[DEBUG LOGIN] 8. Server response received:", response);
      setMessage(response.message);

      if (response.success && response.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.removeItem("scopeguard_user_id");
        console.log("[DEBUG LOGIN] 9. Router navigation initiating to /app");
        nav({ to: "/app" });
      }
    } catch (err) {
      console.error("[DEBUG LOGIN] Exception in login request:", err);
      const error = err as Error;
      setMessage(error.message || "An error occurred during login. Check server logs.");
    }
  }

  return (
    <div className="auth-scene auth-paper min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key="login-atmosphere"
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 auth-aurora" />
          <div className="absolute inset-0 auth-grid opacity-60" />
          <motion.div
            className="auth-orbit auth-orbit-one"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="auth-orbit auth-orbit-two"
            animate={{ rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/70 to-transparent" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between lg:absolute lg:left-8 lg:right-8 lg:top-7"
        >
          <Link to="/" aria-label="ScopeGuard home">
            <Logo />
          </Link>
          <ThemeToggle />
        </motion.div>

        <section className="hidden pt-20 lg:block">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Contract-aware workspace protection
            </div>
            <h1 className="mt-8 max-w-[11ch] text-balance font-display text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-6xl">
              Walk into the workday already protected.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-muted-foreground">
              ScopeGuard watches your inbox against active contracts, surfaces risk, and turns messy
              change requests into clear next steps.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.75,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-10 grid max-w-xl grid-cols-2 gap-3"
          >
            {featureCards.map(({ title, detail, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card/60 p-4 shadow-lg backdrop-blur-2xl"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-5 text-[13px] font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-[12px] leading-5 text-muted-foreground">{detail}</div>
              </div>
            ))}
          </motion.div>
        </section>

        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center py-10 lg:min-h-screen lg:justify-end lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.65,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -2 }}
            className="auth-card auth-paper-card lift w-full max-w-md p-6 sm:p-8"
          >
            <div className="text-center">
              <motion.div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary shadow-[0_18px_50px_-24px_var(--primary)]"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShieldCheck className="h-7 w-7" />
              </motion.div>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                Enter your workspace and keep every change request in view.
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleLogin}>
              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.26 }}
              >
                <Label htmlFor="email" className="text-[12px]">
                  Work email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="alex@studio.com"
                    defaultValue="alex@studio.com"
                    className="h-11 rounded-lg border-border/80 bg-background/70 pl-10 shadow-sm transition-all duration-300 focus-visible:bg-background focus-visible:shadow-[0_12px_30px_-20px_var(--primary)]"
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.34 }}
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px]">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    defaultValue="password123"
                    className="h-11 rounded-lg border-border/80 bg-background/70 pr-10 shadow-sm transition-all duration-300 focus-visible:bg-background focus-visible:shadow-[0_12px_30px_-20px_var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {message ? (
                <p className="text-center text-[13px] text-muted-foreground">{message}</p>
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42 }}
              >
                <Button
                  type="submit"
                  className="group h-11 w-full rounded-lg shadow-[0_18px_40px_-22px_var(--primary)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Log in
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Button>
              </motion.div>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg bg-background/40 transition-all duration-300 hover:-translate-y-0.5"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isGithubLoading}
              >
                <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24">
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
                {isGoogleLoading ? "Connecting..." : "Google"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg bg-background/40 transition-all duration-300 hover:-translate-y-0.5"
                onClick={handleGithubLogin}
                disabled={isGoogleLoading || isGithubLoading}
              >
                <Github className="mr-1.5 h-4 w-4 text-foreground" />
                {isGithubLoading ? "Connecting..." : "GitHub"}
              </Button>
            </div>

            <div className="mt-6 text-center text-[13px] text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="font-medium text-foreground hover:underline">
                Request access
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-4 left-1/2 hidden w-[min(68rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-border bg-card/45 p-3 shadow-2xl backdrop-blur-2xl lg:block"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="grid grid-cols-3 gap-3 text-[12px] text-muted-foreground">
            {["Inbox synced", "Contract matched", "Reply drafted"].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
