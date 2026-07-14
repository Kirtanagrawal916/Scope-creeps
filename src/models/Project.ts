import mongoose, { Schema, Document, Types } from "mongoose";

export type ProjectStatus = "on_track" | "at_risk" | "scope_creep" | "completed";
export type RiskLevel = "low" | "medium" | "high";

export interface IProject extends Document {
  owner: Types.ObjectId;
  name: string;
  client: string;
  clientInitials: string;
  budget: number;
  hourlyRate: number;
  hoursAllocated: number;
  hoursUsed: number;
  progress: number;
  status: ProjectStatus;
  risk: RiskLevel;
  contract: string;
  scopeItems: string[];
  outOfScope: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    // Every project must belong to exactly one user — the owner field is the
    // single enforcement point for all IDOR prevention.
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    clientInitials: { type: String, required: true, trim: true, maxlength: 3 },
    budget: { type: Number, required: true, default: 0, min: 0 },
    hourlyRate: { type: Number, default: 0, min: 0 },
    hoursAllocated: { type: Number, default: 0, min: 0 },
    hoursUsed: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["on_track", "at_risk", "scope_creep", "completed"],
      default: "on_track",
    },
    risk: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    contract: { type: String, default: "" },
    scopeItems: [{ type: String }],
    outOfScope: [{ type: String }],
  },
  { timestamps: true },
);

// Compound indexes for high-performance, ownership-scoped queries.
// All DB lookups MUST include { owner: userId } to prevent IDOR.
ProjectSchema.index({ owner: 1, _id: 1 });
ProjectSchema.index({ owner: 1, updatedAt: -1 });

export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
