import mongoose, { Schema, Document, Types } from "mongoose";

export type AnalysisVerdict = "in_scope" | "out_of_scope" | "mixed";

export interface IAnalysis extends Document {
  owner: Types.ObjectId;
  projectId: Types.ObjectId;
  emailId: Types.ObjectId;
  verdict: AnalysisVerdict;
  confidence: number;
  additionalHours: number;
  timelineImpactDays: number;
  suggestedCost: number;
  includedFeatures: string[];
  outOfScopeFeatures: string[];
  reasoning: string;
  suggestedReply: string;
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
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    emailId: {
      type: Schema.Types.ObjectId,
      ref: "EmailThread",
      required: true,
      index: true,
    },
    verdict: {
      type: String,
      enum: ["in_scope", "out_of_scope", "mixed"],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    additionalHours: { type: Number, default: 0, min: 0 },
    timelineImpactDays: { type: Number, default: 0, min: 0 },
    suggestedCost: { type: Number, default: 0, min: 0 },
    includedFeatures: [{ type: String }],
    outOfScopeFeatures: [{ type: String }],
    reasoning: { type: String, default: "" },
    suggestedReply: { type: String, default: "" },
  },
  { timestamps: true },
);

AnalysisSchema.index({ owner: 1, _id: 1 });
AnalysisSchema.index({ owner: 1, projectId: 1 });
// One analysis per email thread per owner — enforced at application layer too
AnalysisSchema.index({ owner: 1, emailId: 1 }, { unique: true });

export const Analysis =
  mongoose.models.Analysis || mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
