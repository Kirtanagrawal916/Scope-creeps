import type { Document, Model, Types } from "mongoose";
import type { RiskLevel } from "./Project";

export interface IEmailThread extends Document {
  owner: Types.ObjectId;
  projectId: Types.ObjectId;
  from: string;
  fromInitials: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: Date;
  analyzed: boolean;
  risk: RiskLevel;
  unread: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let EmailThread: Model<IEmailThread>;

if (typeof window !== "undefined") {
  EmailThread = {} as Model<IEmailThread>;
} else {
  const mongooseMod = await import("mongoose");
  const mongoose = mongooseMod.default || mongooseMod;
  const Schema = mongoose.Schema;

  const EmailThreadSchema = new Schema<IEmailThread>(
    {
      // owner is always set from session — never from client input
      owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      // projectId scopes the email to a specific project.
      // All queries MUST verify that the project also belongs to owner.
      projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
      },
      from: { type: String, required: true, trim: true },
      fromInitials: { type: String, required: true, trim: true, maxlength: 3 },
      subject: { type: String, required: true, trim: true },
      preview: { type: String, default: "" },
      body: { type: String, default: "" },
      receivedAt: { type: Date, default: Date.now },
      analyzed: { type: Boolean, default: false },
      risk: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      unread: { type: Boolean, default: true },
    },
    { timestamps: true },
  );

  EmailThreadSchema.index({ owner: 1, _id: 1 });
  EmailThreadSchema.index({ owner: 1, projectId: 1 });
  // For inbox alert queries: unanalyzed high-risk emails
  EmailThreadSchema.index({ owner: 1, analyzed: 1, risk: 1 });
  EmailThreadSchema.index({ owner: 1, subject: 1 });
  EmailThreadSchema.index({ owner: 1, from: 1 });

  EmailThread =
    mongoose.models.EmailThread || mongoose.model<IEmailThread>("EmailThread", EmailThreadSchema);
}

export { EmailThread };
