import {
  getAllNotifications,
  markAsRead as markNotificationAsRead,
} from "../services/notificationService.js";

/**
 * Lists all notifications (newest first).
 * GET /api/notifications
 */
export function getNotifications(req, res) {
  const result = getAllNotifications();
  res.json({ success: true, notifications: result.data });
}

/**
 * Marks a single notification as read.
 * PATCH /api/notifications/:id/read
 */
export function markAsRead(req, res) {
  const { id } = req.params;

  const result = markNotificationAsRead(id);

  if (!result.success) {
    return res.status(404).json({ success: false, message: result.message });
  }

  res.json({ success: true, notification: result.data });
}
