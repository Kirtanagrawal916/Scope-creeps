import { generateResponse } from "./geminiService.js";
import { parseGeminiJson } from "../utils/parseGeminiJson.js";
import { successResult, failureResult } from "../utils/serviceResult.js";

/**
 * Builds the Gemini prompt for reply drafting. Kept private to this
 * service — controllers never construct prompts themselves.
 */
function buildReplyDraftPrompt(email, analysis) {
  return `You are a professional client-communications assistant. Draft a polite, clear, professional email reply to the client, based on the scope analysis provided.

Client's Original Email:
"""
${email}
"""

Scope Analysis:
"""
${analysis}
"""

Write a reply that: acknowledges the request, clearly states what is in scope vs. out of scope (per the analysis), and if anything is out of scope, proposes next steps (e.g. a change order or follow-up conversation) without being confrontational.

Respond with ONLY valid JSON (no markdown code fences, no extra commentary) in exactly this shape:
{
  "reply": "<the full professional email reply text>",
  "reasoning": "<a few sentences explaining why the reply was framed this way>",
  "confidence": <integer 0-100, how confident you are this reply is appropriate to send as-is>
}`;
}

/**
 * Generates a suggested professional reply for a client email, given a
 * prior scope analysis. Does NOT send anything — text generation only.
 *
 * @param {string} email
 * @param {string} analysis
 * @returns {Promise<{ success: boolean, isPlaceholder: boolean, data: object|null, message: string|null }>}
 */
export async function draftReply(email, analysis) {
  const prompt = buildReplyDraftPrompt(email, analysis);
  const result = await generateResponse(prompt);

  if (!result.success) {
    return failureResult(result.message, result.isPlaceholder);
  }

  try {
    const data = parseGeminiJson(result.text);
    return successResult(data);
  } catch {
    return failureResult("Gemini response was not valid JSON.", true);
  }
}
