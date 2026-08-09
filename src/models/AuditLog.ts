import type { Document, Model, Types } from "mongoose";

export type AuditAction =
  | "admin_login"
  | "user_updated"
  | "user_role_changed"
  | "user_activated"
  | "user_deactivated"
  | "feature_flag_toggled"
  | "feature_flag_created";

export type AuditTargetType = "user" | "feature_flag" | "system";

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorEmail: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

let AuditLog: Model<IAuditLog>;

if (typeof window !== "undefined") {
  AuditLog = {} as Model<IAuditLog>;
} else {
  const mongooseMod = await import("mongoose");
  const mongoose = mongooseMod.default || mongooseMod;
  const Schema = mongoose.Schema;

  const AuditLogSchema = new Schema<IAuditLog>(
    {
      actorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      actorEmail: { type: String, required: true, trim: true },
      action: {
        type: String,
        required: true,
        enum: [
          "admin_login",
          "user_updated",
          "user_role_changed",
          "user_activated",
          "user_deactivated",
          "feature_flag_toggled",
          "feature_flag_created",
        ],
        index: true,
      },
      targetType: {
        type: String,
        enum: ["user", "feature_flag", "system"],
        required: false,
      },
      targetId: { type: String, required: false },
      message: { type: String, required: true, trim: true },
      metadata: { type: Schema.Types.Mixed, required: false },
    },
    {
      timestamps: true,
    },
  );

  AuditLogSchema.index({ createdAt: -1 });

  AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
}

export { AuditLog };
