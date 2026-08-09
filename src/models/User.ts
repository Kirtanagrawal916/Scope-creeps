import type { Document, Model } from "mongoose";
import { hashPassword } from "../lib/bcrypt";

// 1. Define the TypeScript Interface for User Document
export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  workspaceName?: string;
  defaultRate?: number;
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  googleId?: string;
  googleProfile?: Record<string, unknown>;
  githubId?: string;
  githubUsername?: string;
  avatar?: string;
  provider?: string;
  providerId?: string;
  authMethod?: string[];
  emailVerified?: boolean;
  isActive?: boolean;
  lastLogin?: Date;
  role?: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

let User: Model<IUser>;

if (typeof window !== "undefined") {
  User = {} as Model<IUser>;
} else {
  const mongooseMod = await import("mongoose");
  const mongoose = mongooseMod.default || mongooseMod;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema<IUser>(
    {
      firstName: { type: String, required: false, trim: true },
      lastName: { type: String, required: false, trim: true },
      email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
      },
      password: { type: String, required: [true, "Password is required"] },
      workspaceName: { type: String, required: false, trim: true },
      defaultRate: { type: Number, required: false },
      currency: { type: String, required: false, default: "INR" },
      currencySymbol: { type: String, required: false, default: "₹" },
      locale: { type: String, required: false, default: "en-IN" },
      timezone: { type: String, required: false, default: "UTC" },
      language: { type: String, required: false, default: "en" },
      dateFormat: { type: String, required: false, default: "MMM d, yyyy" },
      googleId: { type: String, required: false },
      googleProfile: { type: Schema.Types.Mixed, required: false },
      githubId: { type: String, required: false },
      githubUsername: { type: String, required: false },
      avatar: { type: String, required: false },
      provider: { type: String, required: false, default: "email" },
      providerId: { type: String, required: false },
      authMethod: { type: [String], required: false, default: ["email"] },
      emailVerified: { type: Boolean, required: false, default: false },
      lastLogin: { type: Date, required: false },
      role: { type: String, enum: ["user", "admin"], required: false, default: "user" },
    },
    { timestamps: true },
  );

  UserSchema.pre("save", async function () {
    if (!this.isModified("password")) {
      return;
    }
    this.password = await hashPassword(this.password);
  });

  User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
}

export { User };
