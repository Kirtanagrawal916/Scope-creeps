import { successResult, failureResult } from "../utils/serviceResult.js";

// TEMPORARY in-memory store. Resets on every server restart.
// TODO: replace with a Mongoose-backed model once MongoDB is implemented —
// the exported function signatures below are designed to stay the same
// when that happens, so the controller won't need to change.

let notifications = [
  {
    id: "1",
    title: "Scope risk detected",
    message: "A recent email may include an out-of-scope request.",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Reply draft ready",
    message: "A suggested reply has been generated for review.",
    read: false,
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

/**
 * Returns all notifications, newest first.
 */
export function getAllNotifications() {
  return successResult([...notifications].reverse());
}

/**
 * Marks a single notification as read by id.
 * Returns success: false with a message if the id doesn't exist, so the
 * controller can respond with 404 instead of silently no-op'ing.
 */
export function markAsRead(id) {
  const notification = notifications.find((n) => n.id === id);

  if (!notification) {
    return failureResult(`Notification with id '${id}' not found.`, false);
  }

  notification.read = true;

  return successResult(notification);
}

/**
 * Adds a new notification. Not wired to any route yet — exported so the
 * Scope Analysis / Reply Drafting flows can push notifications once that
 * integration is in scope.
 */
export function addNotification({ title, message }) {
  const notification = {
    id: String(nextId++),
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.push(notification);

  return successResult(notification);
}
