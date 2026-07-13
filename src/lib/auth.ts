import { connectToDatabase } from "./db";
import { User, IUser } from "../models/User";
import { comparePassword } from "./bcrypt";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { verifyToken, signToken } from "./jwt";

const COOKIE_NAME = "session_token";

export async function checkLogin(email: string, password: string) {
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

/**
 * Sets the session cookie containing the JWT.
 */
export function setSessionCookie(token: string) {
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Deletes the session cookie on logout.
 */
export function deleteSessionCookie() {
  deleteCookie(COOKIE_NAME);
}

/**
 * Gets the verified user payload from the session cookie.
 */
export async function getSessionUser(): Promise<IUser | null> {
  const token = getCookie(COOKIE_NAME);
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Sliding Session Expiration: refresh JWT to extend session by another 7 days
  try {
    const refreshedToken = await signToken({ userId: payload.userId, email: payload.email || "" });
    setSessionCookie(refreshedToken);
  } catch (err) {
    console.error("Failed to refresh session token:", err);
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select("-password");
  return user;
}

export const updateWorkspaceSettings = createServerFn({ method: "POST" })
  .validator((data: { workspaceName: string; defaultRate?: number }) => data)
  .handler(async ({ data }) => {
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
  });

export const updateProfile = createServerFn({ method: "POST" })
  .validator((data: { firstName?: string; lastName?: string }) => data)
  .handler(async ({ data }) => {
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
  });
