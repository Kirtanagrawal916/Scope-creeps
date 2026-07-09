import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Log in — ScopeGuard" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 bg-radial-glow opacity-60" />
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mx-auto">
          <Logo />
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel mt-8 p-8"
        >
          <h1 className="text-center font-display text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-center text-[13px] text-muted-foreground">
            Log in to your ScopeGuard workspace
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              nav({ to: "/app" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">Work email</Label>
              <Input id="email" type="email" placeholder="alex@studio.com" defaultValue="alex@studio.com" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12px]">Password</Label>
                <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">
                  Forgot?
                </a>
              </div>
              <Input id="password" type="password" defaultValue="••••••••" />
            </div>
            <Button type="submit" className="w-full">Log in</Button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => nav({ to: "/app" })}>
              Continue with Google
            </Button>
            <Button variant="outline" onClick={() => nav({ to: "/app" })}>
              Continue with GitHub
            </Button>
          </div>
        </motion.div>
        <div className="mt-6 text-center text-[13px] text-muted-foreground">
          No account?{" "}
          <Link to="/register" className="text-foreground hover:underline">
            Start free
          </Link>
        </div>
      </div>
    </div>
  );
}
