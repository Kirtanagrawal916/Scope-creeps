import {
  createOAuth2Client,
  isGoogleOAuthConfigured,
  GOOGLE_OAUTH_SCOPES,
} from "../config/googleOAuth.js";
import {
  fetchEmails as fetchEmailsFromService,
  sendEmail as sendEmailFromService,
} from "../services/gmailService.js";
import { incrementEmailsProcessed, incrementEmailsSent } from "../services/analyticsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Redirects the user to Google's consent screen.
 * GET /api/gmail/oauth/start
 */
export function startOAuth(req, res) {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth credentials are not configured.",
    });
  }

  const oAuth2Client = createOAuth2Client();

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent",
    scope: GOOGLE_OAUTH_SCOPES,
  });

  res.redirect(url);
}

/**
 * Google redirects back here with a one-time auth code, which is exchanged
 * for tokens. Tokens are returned as JSON for now so the flow can be
 * verified end-to-end — persisting them against a user record comes in a
 * later step once that DB work is in scope.
 * GET /api/gmail/oauth/callback
 */
export const oauthCallback = asyncHandler(async (req, res) => {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth credentials are not configured.",
    });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Missing 'code' query parameter from Google redirect.",
    });
  }

  try {
    const oAuth2Client = createOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);

    // TEMPORARY: returning tokens directly for verification purposes only.
    // TODO: persist tokens against the authenticated user once the DB layer exists.
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to exchange code for tokens: ${error.message}`,
    });
  }
});

/**
 * Returns the latest 10 emails (subject, from, date, snippet, messageId).
 * No analysis, no Gemini — this just reads and returns Gmail data.
 * GET /api/gmail/emails
 *
 * TODO: once token persistence exists (DB/user record), read tokens from
 * there instead. Until then, the access_token/refresh_token obtained from
 * /oauth/callback must be passed as query params to authenticate.
 */
export const getEmails = asyncHandler(async (req, res) => {
  const { access_token, refresh_token } = req.query;

  if (!access_token) {
    return res.status(400).json({
      success: false,
      message:
        "Missing 'access_token' query parameter. Token storage isn't implemented yet — pass the access_token (and refresh_token, if you have one) from /oauth/callback.",
    });
  }

  const tokens = { access_token, refresh_token };

  const result = await fetchEmailsFromService(tokens, { maxResults: 10 });

  if (!result.success) {
    return res.status(502).json({ success: false, message: result.message });
  }

  incrementEmailsProcessed(result.data.messages.length);
  res.json({ success: true, emails: result.data.messages });
});

/**
 * Sends a plain-text email through the authenticated Gmail account.
 * No AI involved — this only sends what's given in the request body.
 * POST /api/gmail/send
 * Body: { "to": "", "subject": "", "body": "" }
 *
 * TODO: once token storage exists, read tokens from there instead of
 * requiring them as query params (same bridge used by GET /emails).
 */
export const sendEmail = asyncHandler(async (req, res) => {
  const { access_token, refresh_token } = req.query;
  const { to, subject, body } = req.body;

  if (!access_token) {
    return res.status(400).json({
      success: false,
      message:
        "Missing 'access_token' query parameter. Token storage isn't implemented yet — pass the access_token (and refresh_token, if you have one) from /oauth/callback.",
    });
  }

  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: "Request body must include 'to', 'subject', and 'body'.",
    });
  }

  const tokens = { access_token, refresh_token };

  const result = await sendEmailFromService(tokens, {
    to,
    subject,
    body,
    isHtml: false, // plain text only, no AI-generated formatting
  });

  if (!result.success) {
    return res.status(502).json({ success: false, message: result.message });
  }

  incrementEmailsSent();
  res.json({
    success: true,
    message: "Email sent successfully.",
    messageId: result.data.messageId,
  });
});
