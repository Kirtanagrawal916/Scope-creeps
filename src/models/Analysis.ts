import mongoose, { Schema, Document, Types } from "mongoose";

export type AnalysisVerdict =
  "in_scope" | "possible_scope_creep" | "confirmed_scope_creep" | "out_of_scope" | "mixed";

export interface IAnalysis extends Document {
  owner: Types.ObjectId; // Original ownership field
  userId: Types.ObjectId; // Added for alignment with new specs (ref: User)
  projectId: Types.ObjectId;
  emailId?: Types.ObjectId;
  originalRequirement: string;
  changedRequirement: string;
  aiExplanation: string;
  verdict: AnalysisVerdict;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  additionalHours: number;
  timelineImpactDays: number;
  suggestedCost: number;
  includedFeatures: string[];
  outOfScopeFeatures: string[];
  reasoning: string;
  suggestedReply: string;

  // New extended fields
  aiSummary: string;
  explanation: string;
  detectedFeatures: string[];
  missingRequirements: string[];
  priority: "low" | "medium" | "high";
  status: "active" | "pending" | "resolved";

  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    emailId: {
      type: Schema.Types.ObjectId,
      ref: "EmailThread",
      required: false,
      index: true,
    },
    originalRequirement: { type: String, required: true, default: "" },
    changedRequirement: { type: String, required: true, default: "" },
    aiExplanation: { type: String, required: true, default: "" },
    verdict: {
      type: String,
      enum: ["in_scope", "possible_scope_creep", "confirmed_scope_creep", "out_of_scope", "mixed"],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    additionalHours: { type: Number, default: 0, min: 0 },
    timelineImpactDays: { type: Number, default: 0, min: 0 },
    suggestedCost: { type: Number, default: 0, min: 0 },
    includedFeatures: [{ type: String }],
    outOfScopeFeatures: [{ type: String }],
    reasoning: { type: String, default: "" },
    suggestedReply: { type: String, default: "" },

    // New fields implementations
    aiSummary: { type: String, required: true, default: "" },
    explanation: { type: String, required: true, default: "" },
    detectedFeatures: [{ type: String }],
    missingRequirements: [{ type: String }],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "pending", "resolved"],
      default: "active",
    },
  },
  { timestamps: true },
);

AnalysisSchema.index({ owner: 1, _id: 1 });
AnalysisSchema.index({ userId: 1, _id: 1 });
AnalysisSchema.index({ owner: 1, projectId: 1 });
AnalysisSchema.index({ userId: 1, projectId: 1 });
AnalysisSchema.index({ owner: 1, emailId: 1 }, { unique: true, sparse: true });
AnalysisSchema.index({ userId: 1, emailId: 1 }, { unique: true, sparse: true });

export const Analysis =
  mongoose.models.Analysis || mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
