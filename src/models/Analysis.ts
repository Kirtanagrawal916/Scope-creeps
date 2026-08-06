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

  // New extended AI fields
  aiSummary: string;
  explanation: string;
  executiveSummary: string;
  technicalExplanation: string;
  potentialRisks: string[];
  recommendations: string[];
  addedRequirements: string[];
  removedRequirements: string[];
  modifiedRequirements: string[];
  missingRequirements: string[];
  detectedFeatures?: string[];
  clientFriendlinessScore: number;
  priority: "low" | "medium" | "high";
  status: "active" | "pending" | "resolved";
  pinned: boolean;
  bookmarked: boolean;
  archived: boolean;
  aiModel?: string;
  promptVersion?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTime?: number;
  isFallback?: boolean;

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
    executiveSummary: { type: String, default: "" },
    technicalExplanation: { type: String, default: "" },
    potentialRisks: [{ type: String }],
    recommendations: [{ type: String }],
    addedRequirements: [{ type: String }],
    removedRequirements: [{ type: String }],
    modifiedRequirements: [{ type: String }],
    detectedFeatures: [{ type: String }],
    missingRequirements: [{ type: String }],
    clientFriendlinessScore: { type: Number, default: 85, min: 0, max: 100 },
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
    pinned: { type: Boolean, default: false, index: true },
    bookmarked: { type: Boolean, default: false, index: true },
    archived: { type: Boolean, default: false, index: true },
    aiModel: { type: String, default: "gemini-2.5-flash" },
    promptVersion: { type: String, default: "v1.0" },
    tokensUsed: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    processingTime: { type: Number, default: 0 },
    isFallback: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

AnalysisSchema.index({ owner: 1, _id: 1 });
AnalysisSchema.index({ userId: 1, _id: 1 });
AnalysisSchema.index({ owner: 1, projectId: 1 });
AnalysisSchema.index({ userId: 1, projectId: 1 });
AnalysisSchema.index({ owner: 1, emailId: 1 }, { unique: true, sparse: true });
AnalysisSchema.index({ userId: 1, emailId: 1 }, { unique: true, sparse: true });
AnalysisSchema.index({ owner: 1, pinned: -1, createdAt: -1 });
AnalysisSchema.index({ userId: 1, pinned: -1, createdAt: -1 });
AnalysisSchema.index({ owner: 1, bookmarked: -1, createdAt: -1 });
AnalysisSchema.index({ userId: 1, bookmarked: -1, createdAt: -1 });
AnalysisSchema.index({ owner: 1, archived: 1, createdAt: -1 });
AnalysisSchema.index({ userId: 1, archived: 1, createdAt: -1 });
AnalysisSchema.index({ owner: 1, verdict: 1, priority: 1, riskLevel: 1 });
AnalysisSchema.index({ owner: 1, confidence: -1 });

export const Analysis =
  mongoose.models.Analysis || mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
