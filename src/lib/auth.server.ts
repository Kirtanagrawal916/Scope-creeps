/**
 * auth.server.ts — SERVER-ONLY authentication module.
 *
 * This file is purely server-only and contains the Mongoose, JWT, Google OAuth,
 * and session cookie setting logic.
 */

import { connectToDatabase } from "./db";
import { User, type IUser } from "../models/User";
import { verifyToken, signToken } from "./jwt";
import { comparePassword } from "./bcrypt";

const COOKIE_NAME = "session_token";

// ---------------------------------------------------------------------------
// Cookie helpers — dynamically import @tanstack/react-start/server to break
// all static dependency chains to client bundles.
// ---------------------------------------------------------------------------

export async function setSessionCookie(token: string) {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function deleteSessionCookie() {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(COOKIE_NAME);
}

/**
 * Reads the session cookie, verifies the JWT, sliding-refreshes it, and
 * returns the hydrated Mongoose user document (without the password field).
 */
export async function getSessionUser(): Promise<IUser | null> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(COOKIE_NAME);
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Sliding session: extend expiry by another 7 days on every valid request
  try {
    const refreshed = await signToken({ userId: payload.userId, email: payload.email || "" });
    await setSessionCookie(refreshed);
  } catch (err) {
    console.error("Failed to refresh session token:", err);
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select("-password");
  return user;
}

// ---------------------------------------------------------------------------
// Server-only authentication helpers
// ---------------------------------------------------------------------------

export async function checkLogin(email: string, password: string) {
  if (typeof email !== "string" || typeof password !== "string") {
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  await connectToDatabase();

  const foundUser = await User.findOne({ email: email.toLowerCase() });
  if (!foundUser) {
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  const isCorrectUser = await comparePassword(password, foundUser.password);
  if (!isCorrectUser) {
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  const userId = foundUser._id.toString();
  const token = await signToken({ userId, email: foundUser.email });

  return {
    success: true,
    userId,
    token,
    email: foundUser.email,
  };
}

export async function registerNewUser(data: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  workspaceName?: string;
}) {
  if (!data || typeof data.email !== "string" || typeof data.password !== "string") {
    return {
      success: false,
      message: "Invalid registration parameters",
      userId: null,
      token: null,
      email: null,
    };
  }

  await connectToDatabase();

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    return {
      success: false,
      message: "User already exists",
      userId: null,
      token: null,
      email: null,
    };
  }

  const newUser = new User({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password, // hashed in pre-save hook
    workspaceName: data.workspaceName,
  });

  await newUser.save();

  const userId = newUser._id.toString();
  const token = await signToken({ userId, email: newUser.email });

  return {
    success: true,
    userId,
    token,
    email: newUser.email,
  };
}

// ---------------------------------------------------------------------------
// Server function implementations (called by createServerFn stubs)
// ---------------------------------------------------------------------------

export async function loginUserImpl(data: { email: string; password: string }) {
  const result = await checkLogin(data.email, data.password);

  if (result.success && result.token) {
    await setSessionCookie(result.token);
  }

  return {
    success: result.success,
    userId: result.userId,
    token: result.token,
    message: result.success ? "Login successful" : "Invalid email or password",
  };
}

export async function registerUserImpl(data: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  workspaceName?: string;
}) {
  const result = await registerNewUser(data);

  if (result.success && result.token) {
    await setSessionCookie(result.token);
  }

  return result;
}

export async function updateWorkspaceSettingsImpl(data: {
  workspaceName: string;
  defaultRate?: number;
}) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!data.workspaceName || data.workspaceName.trim() === "") {
    throw new Error("Workspace name is required.");
  }

  await connectToDatabase();
  user.workspaceName = data.workspaceName.trim();
  if (typeof data.defaultRate === "number") {
    user.defaultRate = data.defaultRate;
  }
  await user.save();

  return {
    success: true,
    message: "Workspace settings updated successfully.",
    user: {
      id: String(user._id),
      workspaceName: user.workspaceName,
      defaultRate: user.defaultRate,
    },
  };
}

export async function updateProfileImpl(data: { firstName?: string; lastName?: string }) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await connectToDatabase();
  if (typeof data.firstName === "string") {
    user.firstName = data.firstName.trim();
  }
  if (typeof data.lastName === "string") {
    user.lastName = data.lastName.trim();
  }
  await user.save();

  return {
    success: true,
    message: "Profile updated successfully.",
    user: {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      workspaceName: user.workspaceName,
    },
  };
}

export async function getGoogleAuthUrlImpl() {
  const { setCookie } = await import("@tanstack/react-start/server");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    throw new Error(
      "Google OAuth configuration is missing. Please define GOOGLE_CLIENT_ID and CALLBACK_URL in .env",
    );
  }

  const state = Math.random().toString(36).substring(2, 15);

  setCookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
}

export async function logoutActionImpl() {
  await deleteSessionCookie();
  return { success: true };
}

export async function handleGoogleCallbackImpl(data: { code: string; state: string }) {
  const { getCookie, deleteCookie } = await import("@tanstack/react-start/server");
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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  // Fetch user info
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
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
    // Link Google fields if not already populated
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

  // Generate JWT and set session cookie
  const sessionToken = await signToken({
    userId: String(user._id),
    email: user.email,
  });

  await setSessionCookie(sessionToken);

  return { success: true };
}
