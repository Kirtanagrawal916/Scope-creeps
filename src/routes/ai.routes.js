import { Router } from "express";
import { analyzeScope, draftReply } from "../controllers/aiController.js";

const router = Router();

// Analyzes an email/thread for scope-creep risk.
router.post("/analyze-scope", analyzeScope);

// Drafts a suggested reply for a given email/thread.
router.post("/draft-reply", draftReply);

export default router;
