import { connectToDatabase } from "./db";
import { User } from "../models/User";
import { comparePassword } from "./bcrypt";
import { signToken } from "./jwt";

export async function checkLogin(email: string, password: string) {
  await connectToDatabase();

  const foundUser = await User.findOne({ email: email.toLowerCase() });
  if (!foundUser) {
    return {
      success: false,
      userId: null,
      token: null,
    };
  }

  const isCorrectUser = await comparePassword(password, foundUser.password);
  if (!isCorrectUser) {
    return {
      success: false,
      userId: null,
      token: null,
    };
  }

  const userId = foundUser._id.toString();
  const token = await signToken(userId);

  return {
    success: true,
    userId,
    token,
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
    return { success: false, message: "User already exists", userId: null, token: null };
  }

  const newUser = new User({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    workspaceName: data.workspaceName,
  });

  await newUser.save();

  const userId = newUser._id.toString();
  const token = await signToken(userId);

  return {
    success: true,
    userId,
    token,
  };
}
