import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      const res = await loginUser({ data: { email, password } });

      if (res.success) {
        if (res.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, res.token);
        }
        await nav({ to: "/app" });
      } else {
        setMessage(res.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-background" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div className="flex items-center justify-between lg:absolute lg:left-8 lg:right-8 lg:top-7">
          <Link to="/" aria-label="ScopeGuard home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <section className="hidden pt-20 lg:block">
          <div className="max-w-xl">
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
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-3">
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
          </div>
        </section>

        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center py-10 lg:min-h-screen lg:justify-end lg:pt-20">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Sign in to your account
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter your credentials to access your ScopeGuard workspace
              </p>
            </div>

            {message && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="h-10 text-xs font-medium gap-2"
              >
                <Mail className="h-4 w-4 text-rose-500" />
                {isGoogleLoading ? "Connecting..." : "Google"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubLogin}
                disabled={isGithubLoading}
                className="h-10 text-xs font-medium gap-2"
              >
                <Github className="h-4 w-4" />
                {isGithubLoading ? "Connecting..." : "GitHub"}
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-mono text-[10px]">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="h-10 text-xs bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-10 text-xs bg-background/50 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 text-xs font-semibold gap-2">
                Sign in to Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
