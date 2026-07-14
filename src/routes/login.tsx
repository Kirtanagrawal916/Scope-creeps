import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
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
import { loginUser, getGoogleAuthUrl } from "@/lib/auth.server";

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
      setMessage("Google login is currently unavailable.");
      setIsGoogleLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const response = await loginUser({ data: { email, password } });
    setMessage(response.message);

    if (response.success && response.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.removeItem("scopeguard_user_id");
      nav({ to: "/app" });
    }
  }

  return (
    <div className="auth-scene relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-700">
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
            <h1 className="mt-8 max-w-lg font-display text-5xl font-semibold leading-[1.02] tracking-tight text-gradient sm:text-6xl">
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
                className="rounded-xl border border-border bg-card/60 p-4 shadow-lg shadow-black/10 backdrop-blur-2xl"
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
            className="auth-card w-full max-w-md p-6 sm:p-8"
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
                    className="h-11 rounded-lg bg-background/60 pl-10 transition-all duration-300 focus-visible:bg-background"
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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="password123"
                  className="h-11 rounded-lg bg-background/60 transition-all duration-300 focus-visible:bg-background"
                />
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
                variant="outline"
                className="h-10 rounded-lg bg-background/40 transition-all duration-300 hover:-translate-y-0.5"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                <Mail className="h-4 w-4" />
                {isGoogleLoading ? "Connecting..." : "Google"}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-lg bg-background/40 transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => nav({ to: "/app" })}
              >
                <Github className="h-4 w-4" />
                GitHub
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
          className="pointer-events-none absolute bottom-4 left-1/2 hidden w-[min(68rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-border bg-card/45 p-3 shadow-2xl shadow-black/10 backdrop-blur-2xl lg:block"
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
