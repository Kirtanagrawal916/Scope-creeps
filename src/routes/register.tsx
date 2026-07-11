import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerNewUser } from "@/lib/auth";
import type { FormEvent } from "react";
import { useState } from "react";

const registerUser = createServerFn({ method: "POST" })
  .validator(
    (data: {
      firstName?: string;
      lastName?: string;
      email: string;
      password: string;
      workspaceName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const result = await registerNewUser(data);
    return result;
  });

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Create your account — ScopeGuard" }] }),
});

function RegisterPage() {
  const nav = useNavigate();
  const [message, setMessage] = useState("");
  
  const perks = [
    "14 days free, no credit card",
    "Analyze up to 200 emails per month",
    "Unlimited contracts on trial",
  ];

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

      if (response.success && response.userId) {
        localStorage.setItem("scopeguard_user_id", response.userId);
        nav({ to: "/app" });
      } else {
        setMessage(response.message || "Registration failed");
      }
    } catch (err: any) {
      setMessage(err.message || "An error occurred during registration");
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
                <Label htmlFor="firstName" className="text-[12px]">First name</Label>
                <Input id="firstName" name="firstName" defaultValue="Alex" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[12px]">Last name</Label>
                <Input id="lastName" name="lastName" defaultValue="Laurent" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">Work email</Label>
              <Input id="email" name="email" type="email" defaultValue="alex@studio.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px]">Password</Label>
              <Input id="password" name="password" type="password" defaultValue="password123" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workspaceName" className="text-[12px]">Workspace name</Label>
              <Input id="workspaceName" name="workspaceName" defaultValue="Laurent Studio" />
            </div>
            {message ? (
              <p className="text-center text-[13px] text-destructive">
                {message}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Create workspace
            </Button>
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
