import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { useState } from "react";

type User = {
  id: string;
  email: string;
  password: string;
};

const fakeUsers: User[] = [
  {
    id: "user_1",
    email: "alex@studio.com",
    password: "password123",
  },
  {
    id: "user_2",
    email: "sam@agency.com",
    password: "hello123",
  },
];

const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const foundUser = fakeUsers.find((user) => user.email === data.email);
    const isCorrectUser = foundUser?.password === data.password;

    return {
      success: isCorrectUser,
      userId: isCorrectUser ? foundUser.id : null,
      message: isCorrectUser
        ? "Login successful"
        : "Invalid email or password",
    };
  });

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Log in - ScopeGuard" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const response = await loginUser({ data: { email, password } });
    setMessage(response.message);

    if (response.success && response.userId) {
      localStorage.setItem("scopeguard_user_id", response.userId);
      nav({ to: "/app" });
    }
  }

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
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">
                Work email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="alex@studio.com"
                defaultValue="alex@studio.com"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12px]">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="password123"
              />
            </div>
            {message ? (
              <p className="text-center text-[13px] text-muted-foreground">
                {message}
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Log in
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              or
            </span>
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
