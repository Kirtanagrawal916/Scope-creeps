import { google } from "googleapis";
import {
  createOAuth2Client,
  isGoogleOAuthConfigured,
} from "../config/googleOAuth.js";
import { successResult, failureResult } from "../utils/serviceResult.js";

/**
 * Builds an authorized Gmail API client from a previously stored token set.
 * Internal helper used by fetchEmails/sendEmail below. Reuses the shared
 * OAuth2 client factory from config/googleOAuth.js (also used by
 * gmailController.js for the OAuth start/callback routes) rather than
 * keeping a separate copy of that logic here.
 *
 * @param {object} tokens - token object from the OAuth callback (or DB later)
 */
function getGmailClient(tokens) {
  if (!isGoogleOAuthConfigured()) return null;

  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(tokens);

  return google.gmail({ version: "v1", auth: oAuth2Client });
}

/**
 * --- Fetching emails ---
 * Lists recent messages and returns their basic metadata (subject, from,
 * snippet). Pagination/filtering options can be extended later.
 *
 * @param {object} tokens
 * @param {{ maxResults?: number, query?: string }} [options]
 */
export async function fetchEmails(tokens, options = {}) {
  const gmail = getGmailClient(tokens);

  if (!gmail) {
    return failureResult("Google OAuth credentials are not configured.", true);
  }

  // Latest 10 only, regardless of what's passed in.
  const maxResults = Math.min(options.maxResults || 10, 10);

  try {
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: options.query,
    });

    const messageRefs = list.data.messages || [];

    const messages = await Promise.all(
      messageRefs.map(async (ref) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: ref.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });

        const headers = full.data.payload?.headers || [];
        const getHeader = (name) =>
          headers.find((h) => h.name === name)?.value || null;

        // Only the fields the /emails endpoint needs — no analysis, no Gemini.
        return {
          messageId: full.data.id,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          date: getHeader("Date"),
          snippet: full.data.snippet,
        };
      }),
    );

    return successResult({ messages });
  } catch (error) {
    return failureResult(`Failed to fetch emails: ${error.message}`, true);
  }
}

/**
 * --- Sending emails ---
 * Sends a plain-text (or HTML) email through the authorized Gmail account.
 *
 * @param {object} tokens
 * @param {{ to: string, subject: string, body: string, isHtml?: boolean }} message
 */
export async function sendEmail(tokens, message) {
  const gmail = getGmailClient(tokens);

  if (!gmail) {
    return failureResult("Google OAuth credentials are not configured.", true);
  }

  try {
    const contentType = message.isHtml ? "text/html" : "text/plain";
    const rawMessage = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      `Content-Type: ${contentType}; charset=utf-8`,
      "",
      message.body,
    ].join("\n");

    // Gmail API requires the raw MIME message as URL-safe base64.
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return successResult({ messageId: result.data.id });
  } catch (error) {
    return failureResult(`Failed to send email: ${error.message}`, true);
  }
}
