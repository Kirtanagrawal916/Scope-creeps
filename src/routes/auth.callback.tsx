import { createFileRoute, redirect } from "@tanstack/react-router";
import { handleGoogleCallback } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { code?: string; state?: string; error?: string } => {
    return {
      code: typeof search.code === "string" ? search.code : undefined,
      state: typeof search.state === "string" ? search.state : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  loaderDeps: ({ search: { code, state, error } }) => ({ code, state, error }),
  loader: async ({ deps: { code, state, error } }) => {
    if (error) {
      throw redirect({
        to: "/login",
        search: {
          error: `Google authentication failed: ${error}`,
        },
      });
    }

    if (!code || !state) {
      throw redirect({
        to: "/login",
        search: {
          error: "Invalid callback request. Missing code or state.",
        },
      });
    }

    try {
      await handleGoogleCallback({ data: { code, state } });
      throw redirect({
        to: "/app",
      });
    } catch (err) {
      if (err && typeof err === "object" && "isRedirect" in err) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : "Authentication failed";
      throw redirect({
        to: "/login",
        search: {
          error: errorMsg,
        },
      });
    }
  },
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <h2 className="text-lg font-medium">Completing authentication...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
