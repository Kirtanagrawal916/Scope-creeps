/**
 * Shared result shape used by service-layer functions across the codebase
 * (gmailService, notificationService, analyticsService, scopeAnalysisService,
 * replyDraftingService), so every controller can check `.success` and read
 * `.data`/`.message` the same way regardless of which service it called.
 *
 * geminiService.js intentionally keeps its own local shape (`text` instead
 * of `data`) — it predates this helper and nothing depends on unifying it,
 * so it's left untouched to avoid any risk to already-verified Gemini wiring.
 */
export function successResult(data) {
  return { success: true, isPlaceholder: false, data, message: null };
}

export function failureResult(message, isPlaceholder) {
  return { success: false, isPlaceholder, data: null, message };
}
