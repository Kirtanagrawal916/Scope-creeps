/**
 * Gemini is asked to respond with raw JSON, but sometimes wraps it in
 * ```json code fences despite instructions — this strips those before
 * parsing. Throws (same as a plain JSON.parse) if the result still isn't
 * valid JSON, so callers can handle it in their existing try/catch.
 *
 * @param {string} text
 * @returns {object}
 */
export function parseGeminiJson(text) {
  const cleaned = text.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(cleaned);
}
