/**
 * notifications.server.ts — Ownership-aware Server Functions & Dispatcher for Notifications.
 *
 * SECURITY CONTRACT: Every notification query strictly enforces `{ userId: user._id }`
 * to prevent IDOR vulnerabilities.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { connectToDatabase } from "./db";
import { Notification } from "../models/Notification";
import { requireSession } from "./authorize.server";
import { AppError } from "./app-error";
import { formatRelativeDate } from "./utils";
import type { NotificationType, NotificationPriority, EntityType } from "../models/Notification";
import type { Types } from "mongoose";

// ---------------------------------------------------------------------------
// Serialized Type — Safe for Client Consumption
// ---------------------------------------------------------------------------

export type SerializedNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  entityType?: EntityType;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  createdAt: string;
  createdAtIso: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): SerializedNotification {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    title: doc.title,
    message: doc.message,
    type: doc.type,
    priority: doc.priority,
    entityType: doc.entityType,
    entityId: doc.entityId,
    actionUrl: doc.actionUrl,
    isRead: doc.isRead ?? false,
    metadata: doc.metadata,
    createdAt: formatRelativeDate(doc.createdAt),
    createdAtIso: new Date(doc.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Centralized Internal Notification Dispatcher
// ---------------------------------------------------------------------------

export interface CreateNotificationParams {
  userId: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  entityType?: EntityType;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates and saves a notification in the database.
 * Realtime architecture ready: SSE / WebSockets broadcast point.
 */
export async function notifyUser(
  params: CreateNotificationParams,
): Promise<SerializedNotification> {
  await connectToDatabase();

  const notification = new Notification({
    userId: params.userId,
    title: params.title.trim(),
    message: params.message.trim(),
    type: params.type,
    priority: params.priority ?? "medium",
    entityType: params.entityType,
    entityId: params.entityId,
    actionUrl: params.actionUrl,
    isRead: false,
    metadata: params.metadata,
  });

  await notification.save();
  return serialize(notification.toObject());
}

// ---------------------------------------------------------------------------
// Zod Validation Schemas
// ---------------------------------------------------------------------------

const listNotificationsSchema = z
  .object({
    isRead: z.boolean().optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    search: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
  })
  .optional();

const markAsReadSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
});

const deleteNotificationSchema = z.object({
  id: z.string().optional(),
  ids: z.array(z.string()).optional(),
});

const bulkActionSchema = z.object({
  action: z.enum(["mark_read", "delete", "clear_all"]),
  ids: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

/**
 * Lists notifications for the authenticated user with filtering & pagination.
 */
export const listNotifications = createServerFn({ method: "GET" })
  .validator((data: unknown) => listNotificationsSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: user._id };

    if (data?.isRead !== undefined) {
      query.isRead = data.isRead;
    }
    if (data?.type && data.type !== "all") {
      query.type = data.type;
    }
    if (data?.priority && data.priority !== "all") {
      query.priority = data.priority;
    }
    if (data?.search) {
      query.$or = [
        { title: { $regex: data.search, $options: "i" } },
        { message: { $regex: data.search, $options: "i" } },
      ];
    }

    const page = data?.page ?? 1;
    const limit = data?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: user._id, isRead: false }),
    ]);

    return {
      notifications: notifications.map(serialize),
      totalCount,
      unreadCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  });

/**
 * Returns fast unread notification count for the session user.
 */
export const getUnreadNotificationCount = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();

  const count = await Notification.countDocuments({ userId: user._id, isRead: false });
  return { count };
});

/**
 * Marks one or multiple notifications as read.
 */
export const markAsRead = createServerFn({ method: "POST" })
  .validator((data: unknown) => markAsReadSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const idsToUpdate = data.ids || (data.id ? [data.id] : []);
    if (idsToUpdate.length === 0) {
      throw new AppError(400, "Notification ID(s) required.");
    }

    await Notification.updateMany(
      { _id: { $in: idsToUpdate }, userId: user._id },
      { $set: { isRead: true } },
    );

    const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });
    return { success: true, unreadCount };
  });

/**
 * Marks ALL unread notifications as read for the session user.
 */
export const markAllAsRead = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();

  await Notification.updateMany({ userId: user._id, isRead: false }, { $set: { isRead: true } });

  return { success: true, unreadCount: 0 };
});

/**
 * Deletes one or multiple notifications.
 */
export const deleteNotification = createServerFn({ method: "POST" })
  .validator((data: unknown) => deleteNotificationSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    const idsToDelete = data.ids || (data.id ? [data.id] : []);
    if (idsToDelete.length === 0) {
      throw new AppError(400, "Notification ID(s) required.");
    }

    await Notification.deleteMany({ _id: { $in: idsToDelete }, userId: user._id });

    const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });
    return { success: true, unreadCount };
  });

/**
 * Clears all notifications for the session user.
 */
export const clearAllNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireSession();
  await connectToDatabase();

  await Notification.deleteMany({ userId: user._id });
  return { success: true, unreadCount: 0 };
});

/**
 * Universal Bulk Notification Actions (mark_read, delete, clear_all).
 */
export const bulkNotificationAction = createServerFn({ method: "POST" })
  .validator((data: unknown) => bulkActionSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await requireSession();
    await connectToDatabase();

    if (data.action === "mark_read" && data.ids?.length) {
      await Notification.updateMany(
        { _id: { $in: data.ids }, userId: user._id },
        { $set: { isRead: true } },
      );
    } else if (data.action === "delete" && data.ids?.length) {
      await Notification.deleteMany({ _id: { $in: data.ids }, userId: user._id });
    } else if (data.action === "clear_all") {
      await Notification.deleteMany({ userId: user._id });
    }

    const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });
    return { success: true, unreadCount };
  });
