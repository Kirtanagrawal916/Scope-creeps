import { analyzeScope as analyzeScopeService } from "../services/scopeAnalysisService.js";
import { draftReply as draftReplyService } from "../services/replyDraftingService.js";
import { incrementAiAnalyses, incrementReplyDrafts } from "../services/analyticsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Analyzes whether a client email request falls within contract scope.
 * POST /api/ai/analyze-scope
 * Body: { "email": "", "contract": "" }
 */
export const analyzeScope = asyncHandler(async (req, res) => {
  const { email, contract } = req.body;

  if (!email || !contract) {
    return res.status(400).json({
      success: false,
      message: "Request body must include 'email' and 'contract'.",
    });
  }

  const result = await analyzeScopeService(email, contract);

  if (!result.success) {
    return res.status(502).json({ success: false, message: result.message });
  }

  incrementAiAnalyses();
  res.json({ success: true, analysis: result.data });
});

/**
 * Generates a suggested professional reply for a client email. Does NOT
 * send anything — text generation only.
 * POST /api/ai/draft-reply
 * Body: { "email": "", "analysis": "" }
 */
export const draftReply = asyncHandler(async (req, res) => {
  const { email, analysis } = req.body;

  if (!email || !analysis) {
    return res.status(400).json({
      success: false,
      message: "Request body must include 'email' and 'analysis'.",
    });
  }

  const result = await draftReplyService(email, analysis);

  if (!result.success) {
    return res.status(502).json({ success: false, message: result.message });
  }

  incrementReplyDrafts();
  res.json({
    success: true,
    reply: result.data.reply,
    reasoning: result.data.reasoning,
    confidence: result.data.confidence,
  });
});
