import { connectToDatabase } from "./db";
import { User } from "../models/User";
import { fakeUsers } from "./fake-users";

export async function checkLogin(email: string, password: string) {
  await connectToDatabase();

  const foundUser = await User.findOne({ email: email.toLowerCase() });
  const isCorrectUser = foundUser?.password === password;

  return {
    success: isCorrectUser,
    userId: isCorrectUser ? (foundUser._id as string).toString() : null,
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
    return { success: false, message: "User already exists" };
  }

  const newUser = new User({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: data.password, // Plain text for now
    workspaceName: data.workspaceName,
  });

  await newUser.save();

  return {
    success: true,
    userId: (newUser._id as string).toString(),
  };
}
