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

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return;
    }

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
  },
  component: ProtectedAppRoute,
});

function ProtectedAppRoute() {
  return <Outlet />;
}
