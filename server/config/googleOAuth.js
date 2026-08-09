import { google } from "googleapis";
import { env } from "./env.js";

/**
 * Scopes requested during the Gmail OAuth consent flow.
 * readonly = list/read messages, send = send messages on the user's behalf.
 */
export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

/**
 * True when all three Google OAuth credentials are present.
 */
export function isGoogleOAuthConfigured() {
  return Boolean(env.google.clientId && env.google.clientSecret && env.google.redirectUri);
}

/**
 * Builds a fresh OAuth2 client using the app's Google credentials.
 * Returns null if credentials aren't configured — callers must check
 * isGoogleOAuthConfigured() first, or handle a null return themselves.
 *
 * A new client is created per call (cheap, stateless) rather than cached,
 * since callers will set per-user credentials on it later.
 */
export function createOAuth2Client() {
  if (!isGoogleOAuthConfigured()) return null;

  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri,
  );
}
