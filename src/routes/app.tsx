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
      workspaceName: user.workspaceName,
    },
  };
});

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    // 1. If running on server (SSR), verify session via cookie
    if (typeof window === "undefined") {
      const auth = await checkAuth();
      if (!auth.authenticated) {
        throw redirect({ to: "/login" });
      }
      return {
        user: auth.user,
      };
    }

    // 2. If running on client, check localStorage token to satisfy teammate's check
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      throw redirect({ to: "/login" });
    }

    try {
      const response = await verifySession({ data: { token } });
      if (!response.valid) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        window.localStorage.removeItem("scopeguard_user_id");
        throw redirect({ to: "/login" });
      }
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem("scopeguard_user_id");
      throw redirect({ to: "/login" });
    }

    // Fetch full user details from server to populate route context for child views
    const auth = await checkAuth();
    if (!auth.authenticated) {
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
