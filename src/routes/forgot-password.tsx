import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEvent } from "react";
import { useState } from "react";

const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim();

    if (!email.includes("@")) {
      return {
        status: "error",
        message: "Please enter a valid email address.",
      };
    }

    return {
      status: "success",
      message: `If ${email} exists, a reset link will be sent.`,
    };
  });

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Forgot password - ScopeGuard" }] }),
});

function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));

    try {
      const response = await requestPasswordReset({ data: { email } });
      setMessage(response.message);
      setStatus(response.status);
    } catch {
      setMessage("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setIsLoading(false);
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
        <div className="panel mt-8 p-8">
          <h1 className="text-center font-display text-2xl font-semibold tracking-tight">
            Reset password
          </h1>
          <p className="mt-1 text-center text-[13px] text-muted-foreground">
            Enter your work email to start a password reset.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handlePasswordReset}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px]">
                Work email
              </Label>
              <Input id="email" name="email" type="email" placeholder="alex@studio.com" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
            {message ? (
              <p
                className={
                  status === "error"
                    ? "text-center text-[13px] text-destructive"
                    : "text-center text-[13px] text-muted-foreground"
                }
              >
                {message}
              </p>
            ) : null}
          </form>
          <div className="mt-6 text-center text-[13px] text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="text-foreground hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
