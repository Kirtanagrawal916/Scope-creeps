import mongoose, { Schema, Document } from "mongoose";

// 1. Define the TypeScript Interface for User Document
export interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  workspaceName?: string;
  createdAt: Date;
  updatedAt: Date;
}

import { hashPassword } from "../lib/bcrypt";

// 2. Define the Mongoose Schema
const UserSchema = new Schema<IUser>(
  {
    firstName: { 
      type: String, 
      required: false,
      trim: true 
    },
    lastName: { 
      type: String, 
      required: false,
      trim: true 
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"]
    },
    password: { 
      type: String, 
      required: [true, "Password is required"] 
    },
    workspaceName: { 
      type: String, 
      required: false,
      trim: true 
    },
  },
  {
    // Automatically manage createdAt and updatedAt fields
    timestamps: true,
  }
);

// Pre-save hook to automatically hash password before storing
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await hashPassword(this.password);
});

// 3. Compile and Export the Model
// Note: We check mongoose.models.User first to prevent re-compilation during hot-reloads in development.
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
