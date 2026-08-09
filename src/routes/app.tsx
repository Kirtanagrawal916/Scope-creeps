import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const AUTH_TOKEN_KEY = "scopeguard_token";

const verifySession = createServerFn({ method: "POST" })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { verifyToken } = await import("@/lib/jwt");
    const session = await verifyToken(data.token);

    return {
      valid: session !== null,
      userId: session?.userId ?? null,
    };
  });

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth.server");
  const user = await getSessionUser();
  if (!user) {
    return { authenticated: false, user: null };
  }
  return {
    authenticated: true,
    user: {
      id: String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      workspaceName: user.workspaceName || "Workspace",
      role: user.role ?? "user",
      defaultRate: user.defaultRate ?? 150,
      currency: user.currency || "INR",
      currencySymbol: user.currencySymbol || "₹",
      locale: user.locale || "en-IN",
      timezone: user.timezone || "UTC",
      language: user.language || "en",
      dateFormat: user.dateFormat || "MMM d, yyyy",

    },
  };
});

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    console.log(
      "[DEBUG ROUTER /app] beforeLoad entered. Window defined?",
      typeof window !== "undefined",
    );
    // 1. If running on server (SSR), verify session via cookie
    if (typeof window === "undefined") {
      console.log("[DEBUG ROUTER /app] SSR auth check via checkAuth...");
      const auth = await checkAuth();
      console.log("[DEBUG ROUTER /app] SSR auth result:", auth);
      if (!auth.authenticated) {
        console.log("[DEBUG ROUTER /app] SSR redirecting to /login");
        throw redirect({ to: "/login" });
      }
      return {
        user: auth.user,
      };
    }

    // 2. If running on client, check localStorage token to satisfy teammate's check
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    console.log("[DEBUG ROUTER /app] Client token from localStorage:", token ? "FOUND" : "MISSING");
    if (!token) {
      console.log("[DEBUG ROUTER /app] Client redirecting to /login (no token)");
      throw redirect({ to: "/login" });
    }

    try {
      console.log("[DEBUG ROUTER /app] Client verifying session token with verifySession...");
      const response = await verifySession({ data: { token } });
      console.log("[DEBUG ROUTER /app] verifySession result:", response);
      if (!response.valid) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem("scopeguard_user_id");
        console.log("[DEBUG ROUTER /app] Token invalid, redirecting to /login");
        throw redirect({ to: "/login" });
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      console.error("[DEBUG ROUTER /app] Error verifying session:", error);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem("scopeguard_user_id");
      throw redirect({ to: "/login" });
    }

    // Fetch full user details from server to populate route context for child views
    console.log("[DEBUG ROUTER /app] Fetching user details with checkAuth...");
    const auth = await checkAuth();
    console.log("[DEBUG ROUTER /app] checkAuth result:", auth);
    if (!auth.authenticated) {
      console.log("[DEBUG ROUTER /app] checkAuth unauthenticated, redirecting to /login");
      throw redirect({ to: "/login" });
    }
    return {
      user: auth.user,
    };
  },
  component: ProtectedAppRoute,
});

function ProtectedAppRoute() {
  return <Outlet />;
}