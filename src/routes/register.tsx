import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Github, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser, getGoogleAuthUrl, getGithubAuthUrl } from "@/lib/auth";
import type { FormEvent } from "react";
import { useState } from "react";

const AUTH_TOKEN_KEY = "scopeguard_token";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Create your account — ScopeGuard" }] }),
});

function RegisterPage() {
  const nav = useNavigate();
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const perks = [
    "14 days free, no credit card",
    "Analyze up to 200 emails per month",
    "Unlimited contracts on trial",
  ];

  async function handleGoogleSignUp() {
    console.log("[OAuth] Google login initiated");
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const response = await getGoogleAuthUrl({ data: {} });
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        setMessage("Google sign-up failed to initialize.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error("Google authentication error:", err);
      setMessage(err instanceof Error ? err.message : "Google sign-up is currently unavailable.");
      setIsGoogleLoading(false);
    }
  }

  async function handleGithubSignUp() {
    console.log("[OAuth] GitHub login initiated");
    setIsGithubLoading(true);
    setMessage("");
    try {
      const response = await getGithubAuthUrl();
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        setMessage("GitHub sign-up failed to initialize.");
        setIsGithubLoading(false);
      }
    } catch (err) {
      console.error("GitHub authentication error:", err);
      setMessage(err instanceof Error ? err.message : "GitHub sign-up is currently unavailable.");
      setIsGithubLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "");
    const lastName = String(form.get("lastName") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const workspaceName = String(form.get("workspaceName") ?? "");

    try {
      const response = await registerUser({
        data: { firstName, lastName, email, password, workspaceName },
      });

      if (response.success && response.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.removeItem("scopeguard_user_id");
        nav({ to: "/app" });
      } else {
        setMessage(response.message || "Registration failed");
      }
    } catch (err) {
      const error = err as Error;
      setMessage(error.message || "An error occurred during registration");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
        <div className="flex items-center justify-between lg:absolute lg:left-8 lg:right-8 lg:top-7">
          <Link to="/" aria-label="ScopeGuard home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="hidden pt-20 lg:block">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Start protecting your contract scope in minutes.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Join agencies and freelancers using ScopeGuard to stop unpaid work, quantify change
            requests, and draft calm, professional responses.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-medium text-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </div>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[calc(100vh-92px)] items-center justify-center py-10 lg:min-h-screen lg:justify-end lg:pt-20">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Create your workspace
              </h2>
              <p className="text-xs text-muted-foreground">Get started with 14 days free trial</p>
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
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className="h-10 text-xs font-medium gap-2"
              >
                <Mail className="h-4 w-4 text-rose-500" />
                {isGoogleLoading ? "Connecting..." : "Google"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignUp}
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
                  Or sign up with email
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Bhavya"
                    required
                    className="h-9 text-xs bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Juneja"
                    required
                    className="h-9 text-xs bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="bhavya@company.com"
                  required
                  className="h-9 text-xs bg-background/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workspaceName" className="text-xs">
                  Workspace name
                </Label>
                <Input
                  id="workspaceName"
                  name="workspaceName"
                  placeholder="Bhavya's Studio"
                  required
                  className="h-9 text-xs bg-background/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="h-9 text-xs bg-background/50 pr-9"
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

              <Button type="submit" className="w-full h-10 text-xs font-semibold mt-2">
                Create Free Workspace
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Already have a workspace?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
