import { getAllNotifications } from "./notificationService.js";
import { successResult } from "../utils/serviceResult.js";

// TEMPORARY in-memory counters. Resets on every server restart.
// TODO: replace with real aggregation queries once MongoDB is implemented.
const counters = {
  emailsProcessed: 0,
  emailsSent: 0,
  aiAnalyses: 0,
  replyDrafts: 0,
};

export function incrementEmailsProcessed(count = 1) {
  counters.emailsProcessed += count;
}

export function incrementEmailsSent() {
  counters.emailsSent += 1;
}

export function incrementAiAnalyses() {
  counters.aiAnalyses += 1;
}

export function incrementReplyDrafts() {
  counters.replyDrafts += 1;
}

/**
 * Assembles the analytics overview. notifications is read live from
 * notificationService rather than tracked as a separate counter, so it
 * can never drift out of sync with the actual notification list.
 */
export function getOverview() {
  const notificationsResult = getAllNotifications();

  return successResult({
    emailsProcessed: counters.emailsProcessed,
    emailsSent: counters.emailsSent,
    aiAnalyses: counters.aiAnalyses,
    replyDrafts: counters.replyDrafts,
    notifications: notificationsResult.data.length,
  });
}
