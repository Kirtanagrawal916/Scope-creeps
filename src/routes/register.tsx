import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Github } from "lucide-react";
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
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const response = await getGoogleAuthUrl();
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-radial-glow opacity-60" />
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
        <div className="absolute left-6 right-6 top-6 flex items-center justify-between md:hidden">
          <Link to="/">
            <Logo />
          </Link>
          <ThemeToggle compact />
        </div>
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <ThemeToggle compact />
          </div>
          <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">
            Join 2,400+ studios protecting their scope.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Set up your workspace in under a minute. Import a contract, connect your inbox, and
            catch your first scope creep today.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" />
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel p-8"
        >
          <Link to="/" className="mt-10 md:hidden">
            <Logo />
          </Link>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            Create your account
          </h2>
          <form className="mt-6 space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-[12px]">
                  First name
                </Label>
                <Input id="firstName" name="firstName" placeholder="Jane" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[12px]">
                  Last name
                </Label>
                <Input id="lastName" name="lastName" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">
                Work email
              </Label>
              <Input id="email" name="email" type="email" placeholder="you@studio.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px]">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-accent/60">
                    <div
                      className={`h-full transition-all duration-300 ${
                        password.length < 6
                          ? "w-1/3 bg-rose-500"
                          : password.length < 10
                            ? "w-2/3 bg-amber-500"
                            : "w-full bg-emerald-500"
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right font-medium">
                    {password.length < 6
                      ? "Weak password"
                      : password.length < 10
                        ? "Moderate password"
                        : "Strong password"}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspaceName" className="text-[12px]">
                Workspace name
              </Label>
              <Input id="workspaceName" name="workspaceName" placeholder="Your Studio" />
            </div>
            {message ? <p className="text-center text-[13px] text-destructive">{message}</p> : null}
            <Button type="submit" className="w-full">
              Create workspace
            </Button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase text-muted-foreground">or sign up with</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg bg-background/40 transition-all duration-300 hover:-translate-y-0.5"
                onClick={handleGoogleSignUp}
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
                onClick={handleGithubSignUp}
                disabled={isGoogleLoading || isGithubLoading}
              >
                <Github className="mr-1.5 h-4 w-4 text-foreground" />
                {isGithubLoading ? "Connecting..." : "GitHub"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
          <div className="mt-6 text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
