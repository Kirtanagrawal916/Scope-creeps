/**
 * auth.ts — Client-safe authentication helpers.
 *
 * This file must NEVER import from @tanstack/react-start/server.
 * All session/cookie logic lives in auth.server.ts.
 */

import { connectToDatabase } from "./db";
import { User } from "../models/User";
import { comparePassword } from "./bcrypt";
import { signToken } from "./jwt";

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
