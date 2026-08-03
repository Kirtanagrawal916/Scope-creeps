/**
 * prompts.ts — ScopeGuard Production AI System Prompt Architecture
 *
 * Enforces structured JSON output with precise scope creep analysis rules.
 */

export interface AnalysisInputContext {
  projectName: string;
  clientName: string;
  hourlyRate: number;
  budget: number;
  scopeItems: string[];
  outOfScopeItems: string[];
  contractTerms?: string;
  subject?: string;
  changedRequirement: string;
  originalRequirement?: string;
  previousAnalysesCount?: number;
}

export function buildScopeAnalysisPrompt(context: AnalysisInputContext): {
  systemInstruction: string;
  promptText: string;
} {
  const systemInstruction = `You are ScopeGuard AI, an expert Senior Software Architect, Product Manager, and Contract Negotiation Strategist.
Your sole mission is to analyze client change requests or emails against an existing project contract/scope and detect Scope Creep with absolute precision.

You MUST respond strictly with valid JSON. Do not include markdown codeblocks or backticks around the JSON unless formatting inside a code field. Return a raw JSON object matching this TypeScript interface:

{
  "verdict": "in_scope" | "possible_scope_creep" | "confirmed_scope_creep" | "out_of_scope" | "mixed",
  "confidence": number (0 to 100),
  "riskLevel": "low" | "medium" | "high",
  "reasoning": string (clear summary explanation),
  "executiveSummary": string (1-2 sentence high level summary for stakeholders),
  "technicalExplanation": string (technical impact on architecture and engineering),
  "potentialRisks": string[] (list of technical or business risks),
  "recommendations": string[] (list of actionable steps for agency team),
  "addedRequirements": string[] (new items introduced by client),
  "removedRequirements": string[] (items client wants to cancel/remove),
  "modifiedRequirements": string[] (existing scope items client wants changed),
  "missingRequirements": string[] (missing technical specs agency needs to ask client),
  "estimatedExtraHours": number (realistic engineering hours needed),
  "estimatedExtraCost": number (estimatedExtraHours * project hourly rate),
  "timelineImpactDays": number (estimated delay in work days),
  "priority": "low" | "medium" | "high",
  "clientFriendlinessScore": number (0 to 100, diplomatic rating of client request),
  "suggestedReply": string (professional, polite email reply explaining cost/timeline implications and proposing a Change Order)
}

SCORING & VERDICT RULES:
- "in_scope": Request is already explicitly covered under defined Scope Items with zero additional cost.
- "possible_scope_creep": Request alters existing requirements or adds ambiguous features requiring minor extra effort.
- "confirmed_scope_creep": Request explicitly adds new features listed in Out-of-Scope or requests significant unbudgeted additions (e.g. mobile app, third party API integrations, full redesign).
- "out_of_scope": Request is completely outside project domain or explicitly forbidden in Out-of-Scope items.
- "mixed": Request contains a mix of bug fixes (in-scope) and new feature requests (scope creep).`;

  const scopeItemsFormatted =
    context.scopeItems && context.scopeItems.length > 0
      ? context.scopeItems.map((item, idx) => `  ${idx + 1}. ${item}`).join("\n")
      : "  (No explicit scope items listed)";

  const outOfScopeFormatted =
    context.outOfScopeItems && context.outOfScopeItems.length > 0
      ? context.outOfScopeItems.map((item, idx) => `  ${idx + 1}. ${item}`).join("\n")
      : "  (No explicit out-of-scope items listed)";

  const promptText = `PROJECT METADATA:
Project Name: ${context.projectName}
Client Name: ${context.clientName}
Hourly Rate: $${context.hourlyRate}/hr
Budget: $${context.budget}
Contract Terms: ${context.contractTerms || "Standard software development agreement"}

DEFINED IN-SCOPE ITEMS:
${scopeItemsFormatted}

DEFINED EXPLICIT OUT-OF-SCOPE ITEMS:
${outOfScopeFormatted}

${context.originalRequirement ? `ORIGINAL REQUIREMENT:\n${context.originalRequirement}\n` : ""}
CLIENT CHANGE REQUEST / EMAIL:
Subject: ${context.subject || "Change Request Analysis"}
Details:
"""
${context.changedRequirement}
"""

Evaluate this request carefully. Calculate estimated extra engineering hours based on industry benchmarks at $${context.hourlyRate}/hr. Return the complete structured JSON response now.`;

  return { systemInstruction, promptText };
}
