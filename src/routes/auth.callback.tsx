import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { handleGoogleCallback, handleGithubCallback } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { code?: string; state?: string; provider?: string; error?: string } => {
    return {
      code: typeof search.code === "string" ? search.code : undefined,
      state: typeof search.state === "string" ? search.state : undefined,
      provider: typeof search.provider === "string" ? search.provider : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  loaderDeps: ({ search: { code, state, provider, error } }) => ({ code, state, provider, error }),
  loader: async ({ deps: { code, state, provider, error } }) => {
    if (error) {
      throw redirect({
        to: "/login",
        search: {
          error: `OAuth authentication failed: ${error}`,
        },
      });
    }

    if (!code || !state) {
      throw redirect({
        to: "/login",
        search: {
          error: "Invalid callback request. Missing authorization code or state token.",
        },
      });
    }

    try {
      const isGithub = provider === "github" || state.startsWith("gh_");
      const response = isGithub
        ? await handleGithubCallback({ data: { code, state } })
        : await handleGoogleCallback({ data: { code, state } });

      return { token: response.token };
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
  head: () => ({ meta: [{ title: "Completing Authentication — ScopeGuard" }] }),
});

function AuthCallbackPage() {
  const { token } = Route.useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem("scopeguard_token", token);
      localStorage.removeItem("scopeguard_user_id");
      navigate({ to: "/app" });
    }
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <h2 className="text-lg font-medium">Completing authentication...</h2>
        <p className="text-sm text-muted-foreground">
          Please wait while we log you into your workspace.
        </p>
      </div>
    </div>
  );
}
