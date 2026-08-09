import { generateResponse } from "./geminiService.js";
import { parseGeminiJson } from "../utils/parseGeminiJson.js";
import { successResult, failureResult } from "../utils/serviceResult.js";

/**
 * Builds the Gemini prompt for scope analysis. Kept private to this
 * service — controllers never see or construct prompts themselves.
 */
function buildScopeAnalysisPrompt(email, contract) {
  return `You are a project-scope analyst. Compare the client's email request against the signed contract, and determine what is in scope, out of scope, and what information is missing to be certain.

Contract:
"""
${contract}
"""

Client Email:
"""
${email}
"""

Respond with ONLY valid JSON (no markdown code fences, no extra commentary) in exactly this shape:
{
  "inScope": ["list of specific request items that ARE covered by the contract"],
  "outOfScope": ["list of specific request items that are NOT covered by the contract"],
  "missingInformation": ["list of information needed to make a confident determination, if any"],
  "confidence": <integer 0-100, how confident you are in this analysis>,
  "explanation": "<a few sentences explaining the reasoning behind the classification>"
}`;
}

/**
 * Analyzes whether a client email request falls within contract scope.
 * Returns the same result shape used across the codebase, so the
 * controller doesn't need special-case error handling.
 *
 * @param {string} email
 * @param {string} contract
 * @returns {Promise<{ success: boolean, isPlaceholder: boolean, data: object|null, message: string|null }>}
 */
export async function analyzeScope(email, contract) {
  const prompt = buildScopeAnalysisPrompt(email, contract);
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
