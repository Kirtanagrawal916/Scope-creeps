import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType =
  | "scope_analysis"
  | "project_created"
  | "project_updated"
  | "project_archived"
  | "analysis_completed"
  | "analysis_failed"
  | "high_risk"
  | "medium_risk"
  | "low_risk"
  | "export_completed"
  | "export_failed"
  | "login"
  | "security"
  | "system"
  | "profile_updated"
  | "settings_changed";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type EntityType = "project" | "analysis" | "export" | "user" | "system";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  entityType?: EntityType;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "scope_analysis",
        "project_created",
        "project_updated",
        "project_archived",
        "analysis_completed",
        "analysis_failed",
        "high_risk",
        "medium_risk",
        "low_risk",
        "export_completed",
        "export_failed",
        "login",
        "security",
        "system",
        "profile_updated",
        "settings_changed",
      ],
      required: true,
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    entityType: {
      type: String,
      enum: ["project", "analysis", "export", "user", "system"],
      required: false,
    },
    entityId: { type: String, required: false },
    actionUrl: { type: String, required: false },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

// High-performance compound indexes for ownership-scoped queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, priority: 1, isRead: 1 });

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
