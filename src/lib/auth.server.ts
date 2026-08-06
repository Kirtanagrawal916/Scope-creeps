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
import { logger } from "./logger";

const COOKIE_NAME = "session_token";

// ---------------------------------------------------------------------------
// Cookie helpers — dynamically import @tanstack/react-start/server to break
// all static dependency chains to client bundles.
// ---------------------------------------------------------------------------

export async function setSessionCookie(token: string) {
  const { setCookie } = await import("@tanstack/react-start/server");
  const secureFlag = process.env.NODE_ENV === "production";
  logger.log(
    `[AUTH SERVER] setSessionCookie: Setting cookie "${COOKIE_NAME}". Options: sameSite=lax, secure=${secureFlag}, path=/, maxAge=7d`,
  );
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: secureFlag,
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
    logger.log("[AUTH SERVER] getSessionUser: No session token cookie found.");
    return null;
  }

  logger.log("[AUTH SERVER] getSessionUser: Found session token cookie. Verifying...");
  const payload = await verifyToken(token);
  if (!payload) {
    logger.warn("[AUTH SERVER] getSessionUser: Session token verification failed or expired.");
    return null;
  }

  logger.log(
    "[AUTH SERVER] getSessionUser: Session token verified successfully. User ID:",
    payload.userId,
  );

  // Sliding session: extend expiry by another 7 days on every valid request
  try {
    const refreshed = await signToken({ userId: payload.userId, email: payload.email || "" });
    await setSessionCookie(refreshed);
    logger.log("[AUTH SERVER] getSessionUser: Refreshed session token cookie (sliding session).");
  } catch (err) {
    logger.error("[AUTH SERVER] getSessionUser: Failed to refresh session token:", err);
  }

  logger.log("[AUTH SERVER] getSessionUser: Connecting to database...");
  try {
    await connectToDatabase();
    logger.log("[AUTH SERVER] getSessionUser: Database connected. Fetching user document...");
  } catch (dbErr) {
    logger.error(
      "[AUTH SERVER] getSessionUser: Database connection failed during user hydration:",
      dbErr,
    );
    throw dbErr;
  }

  const user = await User.findById(payload.userId).select("-password");
  if (!user) {
    logger.warn("[AUTH SERVER] getSessionUser: User not found in DB for ID:", payload.userId);
  } else {
    logger.log("[AUTH SERVER] getSessionUser: Successfully hydrated user details for:", user.email);
  }
  return user;
}

// ---------------------------------------------------------------------------
// Server-only authentication helpers
// ---------------------------------------------------------------------------

export async function checkLogin(email: string, password: string) {
  logger.log(`[AUTH SERVER] checkLogin: Received checkLogin for email: ${email}`);
  if (typeof email !== "string" || typeof password !== "string") {
    logger.error("[AUTH SERVER] checkLogin: Invalid credentials format.");
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  logger.log("[AUTH SERVER] checkLogin: Connecting to database...");
  try {
    await connectToDatabase();
    logger.log("[AUTH SERVER] checkLogin: Database connected successfully.");
  } catch (dbErr) {
    logger.error("[AUTH SERVER] checkLogin: Database connection failed!", dbErr);
    throw dbErr;
  }

  const normalizedEmail = email.toLowerCase();
  logger.log(`[AUTH SERVER] checkLogin: Searching User document in DB for: ${normalizedEmail}`);
  const foundUser = await User.findOne({ email: normalizedEmail });
  if (!foundUser) {
    logger.warn(
      `[AUTH SERVER] checkLogin: User not found in database for email: ${normalizedEmail}`,
    );
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  logger.log("[AUTH SERVER] checkLogin: User found. Comparing password hash...");
  const isCorrectUser = await comparePassword(password, foundUser.password);
  if (!isCorrectUser) {
    logger.warn("[AUTH SERVER] checkLogin: Password comparison failed.");
    return {
      success: false,
      userId: null,
      token: null,
      email: null,
    };
  }

  logger.log("[AUTH SERVER] checkLogin: Password matched. Signing JWT token...");
  foundUser.lastLogin = new Date();
  await foundUser.save();

  const userId = foundUser._id.toString();
  const token = await signToken({ userId, email: foundUser.email });
  logger.log("[AUTH SERVER] checkLogin: JWT token signed successfully.");

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
  logger.log(`[AUTH SERVER] registerNewUser: Starting registration for email: ${data?.email}`);
  if (!data || typeof data.email !== "string" || typeof data.password !== "string") {
    logger.error("[AUTH SERVER] registerNewUser: Invalid registration parameters received.");
    return {
      success: false,
      message: "Invalid registration parameters",
      userId: null,
      token: null,
      email: null,
    };
  }

  logger.log("[AUTH SERVER] registerNewUser: Connecting to database...");
  try {
    await connectToDatabase();
    logger.log("[AUTH SERVER] registerNewUser: Database connected successfully.");
  } catch (dbErr) {
    logger.error("[AUTH SERVER] registerNewUser: Database connection failed!", dbErr);
    throw dbErr;
  }

  const normalizedEmail = data.email.toLowerCase();
  logger.log(
    `[AUTH SERVER] registerNewUser: Checking if user already exists for: ${normalizedEmail}`,
  );
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    logger.warn(`[AUTH SERVER] registerNewUser: User already exists for: ${normalizedEmail}`);
    return {
      success: false,
      message: "User already exists",
      userId: null,
      token: null,
      email: null,
    };
  }

  const firstName = data.firstName || "User";
  const lastName = data.lastName || "";
  const workspaceName = data.workspaceName || `${firstName}'s Workspace`;

  logger.log("[AUTH SERVER] registerNewUser: Creating new User document...");
  const newUser = new User({
    firstName,
    lastName,
    email: normalizedEmail,
    password: data.password,
    workspaceName,
    provider: "email",
    authMethod: ["email"],
    lastLogin: new Date(),
  });

  await newUser.save();
  logger.log("[AUTH SERVER] registerNewUser: User document saved successfully.");

  const userId = newUser._id.toString();
  const token = await signToken({ userId, email: normalizedEmail });

  return {
    success: true,
    message: "Registration successful",
    userId,
    token,
    email: normalizedEmail,
  };
}

// ---------------------------------------------------------------------------
// Server function implementations (called by createServerFn stubs)
// ---------------------------------------------------------------------------

export async function loginUserImpl(data: { email: string; password: string }) {
  logger.log(`[AUTH SERVER] loginUserImpl: Processing login call for: ${data?.email}`);
  try {
    const result = await checkLogin(data.email, data.password);

    if (result.success && result.token) {
      logger.log(
        `[AUTH SERVER] loginUserImpl: Authentication succeeded for ${data.email}. Setting session cookie...`,
      );
      await setSessionCookie(result.token);
      logger.log("[AUTH SERVER] loginUserImpl: Session cookie set completed.");
    } else {
      logger.warn(`[AUTH SERVER] loginUserImpl: Authentication failed for ${data.email}.`);
    }

    return {
      success: result.success,
      userId: result.userId,
      token: result.token,
      message: result.success ? "Login successful" : "Invalid email or password",
    };
  } catch (err) {
    logger.error("[AUTH SERVER] loginUserImpl: Catastrophic error during login process:", err);
    throw err;
  }
}

export async function registerUserImpl(data: {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  workspaceName?: string;
}) {
  logger.log(`[AUTH SERVER] registerUserImpl: Processing registration call for: ${data?.email}`);
  try {
    const result = await registerNewUser(data);

    if (result.success && result.token) {
      logger.log(
        `[AUTH SERVER] registerUserImpl: Registration succeeded for ${data.email}. Setting session cookie...`,
      );
      await setSessionCookie(result.token);
      logger.log("[AUTH SERVER] registerUserImpl: Session cookie set completed.");
    } else {
      logger.warn(`[AUTH SERVER] registerUserImpl: Registration failed for ${data.email}.`);
    }

    return result;
  } catch (err) {
    logger.error(
      "[AUTH SERVER] registerUserImpl: Catastrophic error during registration process:",
      err,
    );
    throw err;
  }
}



export async function getGoogleAuthUrlImpl() {
  const { setCookie } = await import("@tanstack/react-start/server");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || "http://localhost:8080";
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    `${appUrl}/auth/callback?provider=google`;

  if (!clientId) {
    throw new Error(
      "Google OAuth configuration is missing. Please define GOOGLE_CLIENT_ID in your .env file.",
    );
  }

  const state = "g_" + Math.random().toString(36).substring(2, 15);

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

export async function getGithubAuthUrlImpl() {
  const { setCookie } = await import("@tanstack/react-start/server");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.APP_URL || "http://localhost:8080";
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    `${appUrl}/auth/callback?provider=github`;

  if (!clientId) {
    throw new Error(
      "GitHub OAuth configuration is missing. Please define GITHUB_CLIENT_ID in your .env file.",
    );
  }

  const state = "gh_" + Math.random().toString(36).substring(2, 15);

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
    scope: "user:email read:user",
    state,
  });

  return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
}

export async function logoutActionImpl() {
  await deleteSessionCookie();
  return { success: true };
}

export async function handleGoogleCallbackImpl(data: { code: string; state: string }) {
  const { getCookie, deleteCookie } = await import("@tanstack/react-start/server");
  const savedState = getCookie("oauth_state");
  deleteCookie("oauth_state");

  if (!savedState || savedState !== data.state) {
    throw new Error("CSRF state validation failed for Google OAuth.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:8080";
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    `${appUrl}/auth/callback?provider=google`;

  if (!clientId || !clientSecret) {
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
    logger.error("Google token exchange failed:", errText);
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
  const normalizedEmail = googleUser.email.toLowerCase();

  // Find existing user by email to perform account linking if already present
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.googleId = googleUser.sub;
    user.googleProfile = googleUser;
    if (!user.avatar && googleUser.picture) {
      user.avatar = googleUser.picture;
    }
    user.emailVerified = true;
    user.lastLogin = new Date();
    if (!user.authMethod) user.authMethod = ["email"];
    if (!user.authMethod.includes("google")) {
      user.authMethod.push("google");
    }
    await user.save();
  } else {
    user = new User({
      firstName: googleUser.given_name || "Google",
      lastName: googleUser.family_name || "User",
      email: normalizedEmail,
      googleId: googleUser.sub,
      googleProfile: googleUser,
      avatar: googleUser.picture,
      provider: "google",
      providerId: googleUser.sub,
      emailVerified: true,
      lastLogin: new Date(),
      authMethod: ["google"],
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

  return { success: true, token: sessionToken };
}

export async function handleGithubCallbackImpl(data: { code: string; state: string }) {
  const { getCookie, deleteCookie } = await import("@tanstack/react-start/server");
  const savedState = getCookie("oauth_state");
  deleteCookie("oauth_state");

  if (!savedState || savedState !== data.state) {
    throw new Error("CSRF state validation failed for GitHub OAuth.");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || "http://localhost:8080";
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL ||
    process.env.CALLBACK_URL ||
    `${appUrl}/auth/callback?provider=github`;

  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth configuration is missing on the server.");
  }

  // Exchange code for token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "ScopeGuard-App",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: data.code,
      redirect_uri: callbackUrl,
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    logger.error("GitHub token exchange failed:", errText);
    throw new Error("Failed to exchange authorization code with GitHub.");
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (tokenData.error || !tokenData.access_token) {
    throw new Error(
      `GitHub token error: ${tokenData.error_description || tokenData.error || "No access token returned"}`,
    );
  }

  const accessToken = tokenData.access_token;

  // Fetch GitHub user profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "ScopeGuard-App",
    },
  });

  if (!userRes.ok) {
    throw new Error("Failed to fetch user profile from GitHub.");
  }

  const ghProfile = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };

  let primaryEmail = ghProfile.email;

  if (!primaryEmail) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "ScopeGuard-App",
      },
    });

    if (emailsRes.ok) {
      const emailsList = (await emailsRes.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primaryObj =
        emailsList.find((e) => e.primary && e.verified) ||
        emailsList.find((e) => e.verified) ||
        emailsList[0];
      if (primaryObj) {
        primaryEmail = primaryObj.email;
      }
    }
  }

  if (!primaryEmail) {
    throw new Error("GitHub account does not expose a verified email address.");
  }

  await connectToDatabase();
  const normalizedEmail = primaryEmail.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  const nameParts = (ghProfile.name || ghProfile.login).trim().split(/\s+/);
  const firstName = nameParts[0] || ghProfile.login;
  const lastName = nameParts.slice(1).join(" ") || "";

  if (user) {
    // Account Linking: existing user found with matching email
    user.githubId = String(ghProfile.id);
    user.githubUsername = ghProfile.login;
    if (!user.avatar && ghProfile.avatar_url) {
      user.avatar = ghProfile.avatar_url;
    }
    user.emailVerified = true;
    user.lastLogin = new Date();
    if (!user.authMethod) user.authMethod = ["email"];
    if (!user.authMethod.includes("github")) {
      user.authMethod.push("github");
    }
    await user.save();
  } else {
    user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      githubId: String(ghProfile.id),
      githubUsername: ghProfile.login,
      avatar: ghProfile.avatar_url,
      provider: "github",
      providerId: String(ghProfile.id),
      emailVerified: true,
      lastLogin: new Date(),
      authMethod: ["github"],
      workspaceName: `${firstName}'s Workspace`,
    });
    await user.save();
  }

  const sessionToken = await signToken({
    userId: String(user._id),
    email: user.email,
  });

  await setSessionCookie(sessionToken);

  return { success: true, token: sessionToken };
}

export async function unlinkProviderImpl(data: { provider: "google" | "github" }) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await connectToDatabase();
  const userDoc = await User.findById(user._id);
  if (!userDoc) {
    throw new Error("User not found.");
  }

  const hasPassword = Boolean(userDoc.password);
  const hasGoogle = Boolean(userDoc.googleId);
  const hasGithub = Boolean(userDoc.githubId);
  const providerCount = (hasPassword ? 1 : 0) + (hasGoogle ? 1 : 0) + (hasGithub ? 1 : 0);

  if (providerCount <= 1) {
    throw new Error(
      `Cannot disconnect ${data.provider} because it is your only login method. Set a password or connect another account first.`,
    );
  }

  if (data.provider === "google") {
    userDoc.googleId = undefined;
    userDoc.googleProfile = undefined;
    if (userDoc.authMethod) {
      userDoc.authMethod = userDoc.authMethod.filter((m: string) => m !== "google");
    }
  } else if (data.provider === "github") {
    userDoc.githubId = undefined;
    userDoc.githubUsername = undefined;
    if (userDoc.authMethod) {
      userDoc.authMethod = userDoc.authMethod.filter((m: string) => m !== "github");
    }
  }

  await userDoc.save();

  return {
    success: true,
    message: `Successfully disconnected ${data.provider} account.`,
  };
}



export async function updateWorkspaceSettingsImpl(data: {
  workspaceName?: string;
  defaultRate?: number;
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await connectToDatabase();
  const userDoc = await User.findById(user._id);
  if (!userDoc) throw new Error("User not found");

  if (data.workspaceName !== undefined) userDoc.workspaceName = data.workspaceName;
  if (data.defaultRate !== undefined) userDoc.defaultRate = data.defaultRate;
  if (data.currency !== undefined) userDoc.currency = data.currency;
  if (data.currencySymbol !== undefined) userDoc.currencySymbol = data.currencySymbol;
  if (data.locale !== undefined) userDoc.locale = data.locale;
  if (data.timezone !== undefined) userDoc.timezone = data.timezone;
  if (data.language !== undefined) userDoc.language = data.language;
  if (data.dateFormat !== undefined) userDoc.dateFormat = data.dateFormat;

  await userDoc.save();

  return {
    success: true,
    message: "Workspace settings updated successfully",
    user: {
      workspaceName: userDoc.workspaceName,
      defaultRate: userDoc.defaultRate,
      currency: userDoc.currency,
      currencySymbol: userDoc.currencySymbol,
      locale: userDoc.locale,
      timezone: userDoc.timezone,
      language: userDoc.language,
      dateFormat: userDoc.dateFormat,
    },
  };
}

export async function updateProfileImpl(data: { firstName?: string; lastName?: string }) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  await connectToDatabase();
  const userDoc = await User.findById(user._id);
  if (!userDoc) throw new Error("User not found");

  if (data.firstName !== undefined) userDoc.firstName = data.firstName;
  if (data.lastName !== undefined) userDoc.lastName = data.lastName;

  await userDoc.save();

  return {
    success: true,
    message: "Profile updated successfully",
    user: {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
    },
  };
}
