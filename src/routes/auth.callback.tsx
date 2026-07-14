import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { setSessionCookie } from "@/lib/auth";
import { signToken } from "@/lib/jwt";

const handleGoogleCallback = createServerFn({ method: "POST" })
  .validator((data: { code: string; state: string }) => data)
  .handler(async ({ data }) => {
    // Verify CSRF state
    const savedState = getCookie("oauth_state");
    deleteCookie("oauth_state");

    if (!savedState || savedState !== data.state) {
      throw new Error("CSRF state validation failed.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new Error("Google OAuth configuration is missing on the server.");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Google token exchange failed:", errText);
      throw new Error("Failed to exchange authorization code with Google.");
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };

    // Fetch user info using access token
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user profile information from Google.");
    }

    const googleUser = (await userResponse.json()) as {
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (!googleUser.email) {
      throw new Error("Google account does not expose a valid email address.");
    }

    await connectToDatabase();

    // Find or create user
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (user) {
      // User exists. Link account and set Google fields if not already populated
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        updated = true;
      }
      if (!user.avatar && googleUser.picture) {
        user.avatar = googleUser.picture;
        updated = true;
      }
      if (user.provider !== "google") {
        user.provider = "google";
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      // User does not exist. Create new user
      const randomPassword =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = new User({
        firstName: googleUser.given_name || "Google",
        lastName: googleUser.family_name || "User",
        email: googleUser.email,
        password: randomPassword,
        googleId: googleUser.sub,
        avatar: googleUser.picture,
        provider: "google",
        workspaceName: `${googleUser.given_name || "Google"}'s Workspace`,
      });
      await user.save();
    }

    // Generate standard JWT session token
    const sessionToken = await signToken({
      userId: String(user._id),
      email: user.email,
    });

    // Set cookie session
    setSessionCookie(sessionToken);

    return { success: true };
  });

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
