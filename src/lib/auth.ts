/**
 * auth.ts — Client-safe authentication handlers.
 *
 * This file is client-visible and contains only createServerFn stubs.
 * It contains ZERO top-level static imports of server-only modules
 * (such as @tanstack/react-start/server, mongoose, or mongodb).
 *
 * The actual implementations are dynamically imported from auth.server.ts
 * inside the handler functions. The TanStack Start compiler strips handler
 * bodies from the client bundle, preventing any server-side dependencies from leaking.
 */

import { createServerFn } from "@tanstack/react-start";

/** Log in with email + password. */
export const loginUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { loginUserImpl } = await import("./auth.server");
    return loginUserImpl(data);
  });

/** Register a new user. */
export const registerUser = createServerFn({ method: "POST" })
  .validator(
    (data: {
      firstName?: string;
      lastName?: string;
      email: string;
      password: string;
      workspaceName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { registerUserImpl } = await import("./auth.server");
    return registerUserImpl(data);
  });

/** Update workspace-level settings for the current session user. */
export const updateWorkspaceSettings = createServerFn({ method: "POST" })
  .validator((data: { workspaceName: string; defaultRate?: number }) => data)
  .handler(async ({ data }) => {
    const { updateWorkspaceSettingsImpl } = await import("./auth.server");
    return updateWorkspaceSettingsImpl(data);
  });

/** Update first/last name for the current session user. */
export const updateProfile = createServerFn({ method: "POST" })
  .validator((data: { firstName?: string; lastName?: string }) => data)
  .handler(async ({ data }) => {
    const { updateProfileImpl } = await import("./auth.server");
    return updateProfileImpl(data);
  });

/** Build the Google OAuth redirect URL and set a CSRF state cookie. */
export const getGoogleAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { getGoogleAuthUrlImpl } = await import("./auth.server");
  return getGoogleAuthUrlImpl();
});

/** Deletes the session cookie. Called by the logout button. */
export const logoutAction = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutActionImpl } = await import("./auth.server");
  return logoutActionImpl();
});

/**
 * Handles the Google OAuth callback: validates CSRF state, exchanges the
 * authorization code for tokens, upserts the user, and sets the session cookie.
 */
export const handleGoogleCallback = createServerFn({ method: "POST" })
  .validator((data: { code: string; state: string }) => data)
  .handler(async ({ data }) => {
    const { handleGoogleCallbackImpl } = await import("./auth.server");
    return handleGoogleCallbackImpl(data);
  });
