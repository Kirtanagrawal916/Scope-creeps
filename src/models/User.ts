import mongoose, { Schema, Document } from "mongoose";
import { hashPassword } from "../lib/bcrypt";

// 1. Define the TypeScript Interface for User Document
export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  workspaceName?: string;
  defaultRate?: number;

  // User preferences
  currency?: string;
  currencySymbol?: string;
  locale?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;

  // Authentication / identity
  provider?: string;
  providerId?: string;
  googleId?: string;
  githubId?: string;
  avatar?: string;
  emailVerified?: boolean;
  githubUsername?: string;
  googleProfile?: Record<string, unknown>;
  lastLogin?: Date;
  authMethod?: string[];

  // Authorization
  role?: "user" | "admin";

  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Mongoose Schema
const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: false,
    },
    workspaceName: {
      type: String,
      required: false,
      trim: true,
    },
    defaultRate: {
      type: Number,
      required: false,
      default: 150,
    },
    currency: {
      type: String,
      default: "INR",
    },
    currencySymbol: {
      type: String,
      default: "₹",
    },
    locale: {
      type: String,
      default: "en-IN",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },
    dateFormat: {
      type: String,
      default: "MMM d, yyyy",
    },
    provider: {
      type: String,
      required: false,
      default: "email",
    },
    providerId: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      required: false,
    },
    githubId: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    githubUsername: {
      type: String,
      required: false,
    },
    googleProfile: {
      type: Schema.Types.Mixed,
      required: false,
    },
    lastLogin: {
      type: Date,
      required: false,
    },
    authMethod: {
      type: [String],
      required: false,
      default: ["email"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      required: false,
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to automatically hash password before storing
UserSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) {
    return;
  }

  this.password = await hashPassword(this.password);
});

// 3. Compile and Export the Model
// Prevent re-compilation during hot-reloads in development.
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
