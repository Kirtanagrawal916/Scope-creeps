import { createMiddleware } from "@tanstack/react-start";
import { getSessionUser } from "./auth.server";

/**
 * Resolves the authenticated user from the session cookie and attaches it to the request context.
 * Does not block unauthenticated requests.
 */
export const resolveUserMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    const user = await getSessionUser();
    return next({
      context: {
        user,
      },
    });
  } catch (error) {
    console.error("resolveUserMiddleware error:", error);
    return next({
      context: {
        user: null,
      },
    });
  }
});

/**
 * Enforces that a valid user session is present.
 * Throws an error if the user is not logged in.
 */
export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return next({
    context: {
      user,
    },
  });
});
