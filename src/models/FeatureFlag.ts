import mongoose, { Schema, Document } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: {
      type: String,
      required: [true, "Flag key is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, "Key may only contain lowercase letters, numbers and underscores"],
    },
    label: {
      type: String,
      required: [true, "Flag label is required"],
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const FeatureFlag =
  mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>("FeatureFlag", FeatureFlagSchema);
