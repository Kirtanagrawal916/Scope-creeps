import { executeGeminiAnalysis } from "./gemini-client";
import { GeminiAnalysisResponseSchema, type GeminiAnalysisResponse } from "./schema";
import type { AnalysisInputContext } from "./prompts";

export interface ScopeAnalysisResult extends GeminiAnalysisResponse {
  aiModel: string;
  promptVersion: string;
  tokensUsed: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTime: number;
  isFallback: boolean;
  fallbackReason?: string;
  // Aliases for legacy server consumers
  explanation: string;
  additionalHours: number;
  suggestedCost: number;
  aiSummary: string;
}

/**
 * Perform rule-based analysis (Fallback Engine).
 * Extracted from existing working logic so the user ALWAYS receives a valid result.
 */
export function performRuleBasedAnalysis(
  context: AnalysisInputContext,
  reason = "Rule-based fallback engine active.",
): ScopeAnalysisResult {
  const content = ((context.subject || "") + " " + context.changedRequirement).toLowerCase();

  const addedFeatures: string[] = [];
  const removedFeatures: string[] = [];
  const modifiedFeatures: string[] = [];
  const missingRequirements: string[] = [];

  let additionalHours = 0;

  // 1. Identify added features (explicit exclusions or keyword checks)
  for (const item of context.outOfScopeItems || []) {
    if (content.includes(item.toLowerCase())) {
      addedFeatures.push(item);
    }
  }

  const creepKeywords = [
    { kw: "ios", label: "Native iOS Application", hours: 120 },
    { kw: "android", label: "Native Android Application", hours: 120 },
    { kw: "app", label: "Mobile Application build", hours: 100 },
    { kw: "netsuite", label: "NetSuite ERP Integration", hours: 48 },
    { kw: "sap", label: "SAP Integration", hours: 48 },
    { kw: "integration", label: "Third-party Integration", hours: 40 },
    { kw: "dashboard", label: "Analytics Dashboard", hours: 30 },
    { kw: "report", label: "SLA Reporting", hours: 15 },
    { kw: "voice", label: "Voice input dictation", hours: 24 },
    { kw: "redesign", label: "Full UI Redesign", hours: 60 },
  ];

  for (const item of creepKeywords) {
    if (content.includes(item.kw)) {
      if (!addedFeatures.includes(item.label)) {
        addedFeatures.push(item.label);
      }
      additionalHours += item.hours;
    }
  }

  // 2. Identify modified features
  const modificationIndicators = [
    "instead of",
    "replace",
    "modify",
    "update",
    "change",
    "switch",
    "alter",
    "upgrade",
  ];
  for (const ind of modificationIndicators) {
    if (content.includes(ind)) {
      for (const item of context.scopeItems || []) {
        if (content.includes(item.toLowerCase()) && !modifiedFeatures.includes(item)) {
          modifiedFeatures.push(item);
          additionalHours += 8;
        }
      }
      break;
    }
  }

  // 3. Identify removed features
  const removalIndicators = [
    "remove",
    "delete",
    "omit",
    "exclude",
    "drop",
    "cancel",
    "no longer need",
    "without",
  ];
  for (const ind of removalIndicators) {
    if (content.includes(ind)) {
      for (const item of context.scopeItems || []) {
        if (content.includes(item.toLowerCase()) && !removedFeatures.includes(item)) {
          removedFeatures.push(item);
        }
      }
      break;
    }
  }

  // 4. Missing requirements
  if (content.includes("voice") && !content.includes("language")) {
    missingRequirements.push("Specification of supported voice recognition languages.");
  }
  if ((content.includes("ios") || content.includes("android")) && !content.includes("store")) {
    missingRequirements.push("App Store deployment keys and publisher account details.");
  }
  if (content.includes("integration") && !content.includes("api documentation")) {
    missingRequirements.push("API documentation and sandbox access for third-party endpoints.");
  }

  // 5. Verdict and estimations
  let verdict:
    "in_scope" | "possible_scope_creep" | "confirmed_scope_creep" | "out_of_scope" | "mixed" =
    "in_scope";
  let riskLevel: "low" | "medium" | "high" = "low";
  let priority: "low" | "medium" | "high" = "medium";

  if (addedFeatures.length > 0) {
    verdict = additionalHours > 50 ? "confirmed_scope_creep" : "possible_scope_creep";
    riskLevel = additionalHours > 50 ? "high" : "medium";
    priority = additionalHours > 50 ? "high" : "medium";
  } else if (modifiedFeatures.length > 0) {
    verdict = "possible_scope_creep";
    riskLevel = "medium";
  } else if (removedFeatures.length > 0) {
    verdict = "in_scope";
  }

  const hourlyRate = context.hourlyRate || 150;
  const estimatedExtraCost = additionalHours * hourlyRate;
  const timelineImpactDays = Math.ceil(additionalHours / 6); // Assuming 6 productive hrs/day

  const executiveSummary =
    verdict === "in_scope"
      ? "The request aligns with the agreed project scope and requires no baseline budget adjustment."
      : `The request introduces new or modified features totaling ~${additionalHours} engineering hours ($${estimatedExtraCost.toLocaleString()}).`;

  const technicalExplanation =
    addedFeatures.length > 0
      ? `System requires engineering work for: ${addedFeatures.join(", ")}.`
      : "No core architectural overhaul required.";

  const potentialRisks = [
    additionalHours > 40
      ? "Unplanned delay in target launch milestone."
      : "Minor context switching overhead.",
    "Potential budget misalignment if scope change is unbilled.",
  ];

  const recommendations = [
    "Issue a formal Change Order to client before initiating work.",
    "Review timeline impact with project management team.",
  ];

  const suggestedReply =
    verdict === "in_scope"
      ? `Hi ${context.clientName},\n\nThanks for reaching out! This request is fully covered within our existing scope. We will proceed as planned.\n\nBest regards,\nScopeGuard Team`
      : `Hi ${context.clientName},\n\nThanks for sending over these details. Adding ${addedFeatures.join(", ") || "these features"} represents a scope expansion estimated at ${additionalHours} hours ($${estimatedExtraCost.toLocaleString()}) and +${timelineImpactDays} business days.\n\nWe would be happy to prepare a Change Order so we can add this to our sprint roadmap.\n\nBest regards,\nScopeGuard Team`;

  return {
    verdict,
    confidence: 82,
    riskLevel,
    reasoning: `Rule-based analysis detected ${addedFeatures.length} added feature(s) and ${modifiedFeatures.length} modified feature(s).`,
    executiveSummary,
    technicalExplanation,
    potentialRisks,
    recommendations,
    addedRequirements: addedFeatures,
    removedRequirements: removedFeatures,
    modifiedRequirements: modifiedFeatures,
    missingRequirements,
    estimatedExtraHours: additionalHours,
    estimatedExtraCost,
    timelineImpactDays,
    priority,
    clientFriendlinessScore: 88,
    suggestedReply,
    aiModel: "rule_based_fallback",
    promptVersion: "v1.0-rule",
    tokensUsed: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    processingTime: 5,
    isFallback: true,
    fallbackReason: reason,
    // Aliases
    explanation: technicalExplanation || executiveSummary,
    additionalHours,
    suggestedCost: estimatedExtraCost,
    aiSummary: executiveSummary,
  };
}

/**
 * Main AI Scope Analysis Orchestrator.
 * Tries Gemini first with Zod validation -> falls back smoothly to Rule-based engine.
 */
export async function analyzeScopeWithAI(
  context: AnalysisInputContext,
  options?: { preferredModel?: string; temperature?: number },
): Promise<ScopeAnalysisResult> {
  const startTime = Date.now();

  try {
    const geminiResult = await executeGeminiAnalysis(context, {
      model: options?.preferredModel,
      temperature: options?.temperature,
    });

    // Clean JSON response (strip potential markdown wrapping)
    let jsonText = geminiResult.rawResponseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsedJson = JSON.parse(jsonText);
    const validated = GeminiAnalysisResponseSchema.parse(parsedJson);

    return {
      ...validated,
      aiModel: geminiResult.modelUsed,
      promptVersion: "v1.0",
      tokensUsed: geminiResult.tokensUsed,
      processingTime: geminiResult.processingTimeMs,
      isFallback: false,
      // Aliases
      explanation:
        validated.technicalExplanation || validated.reasoning || validated.executiveSummary,
      additionalHours: validated.estimatedExtraHours ?? 0,
      suggestedCost: validated.estimatedExtraCost ?? 0,
      aiSummary: validated.executiveSummary || validated.reasoning,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[ScopeAIService] Gemini AI analysis unavailable (${errorMsg}). Activating fallback engine.`,
    );

    const fallbackResult = performRuleBasedAnalysis(context, errorMsg);
    fallbackResult.processingTime = Date.now() - startTime;
    return fallbackResult;
  }
}
