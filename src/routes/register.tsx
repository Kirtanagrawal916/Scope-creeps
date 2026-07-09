import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Create your account — ScopeGuard" }] }),
});

function RegisterPage() {
  const nav = useNavigate();
  const perks = [
    "14 days free, no credit card",
    "Analyze up to 200 emails per month",
    "Unlimited contracts on trial",
  ];
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-radial-glow opacity-60" />
      <div className="relative mx-auto grid min-h-screen max-w-5xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:items-center">
        <div className="hidden md:block">
          <Link to="/">
            <Logo />
          </Link>
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
          <Link to="/" className="md:hidden">
            <Logo />
          </Link>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            Create your account
          </h2>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              nav({ to: "/app" });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[12px]">First name</Label>
                <Input defaultValue="Alex" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Last name</Label>
                <Input defaultValue="Laurent" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Work email</Label>
              <Input type="email" defaultValue="alex@studio.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Password</Label>
              <Input type="password" defaultValue="••••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Workspace name</Label>
              <Input defaultValue="Laurent Studio" />
            </div>
            <Button type="submit" className="w-full">Create workspace</Button>
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
