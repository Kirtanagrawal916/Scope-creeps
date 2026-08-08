import { Router } from "express";
import {
  startOAuth,
  oauthCallback,
  getEmails,
  sendEmail,
} from "../controllers/gmailController.js";

const router = Router();

// Kicks off the Google consent screen redirect.
router.get("/oauth/start", startOAuth);

// Google redirects back here with an auth code.
router.get("/oauth/callback", oauthCallback);

// Lists recent emails for the authenticated user.
router.get("/emails", getEmails);

// Sends an email through the authenticated Gmail account.
router.post("/send", sendEmail);

export default router;
