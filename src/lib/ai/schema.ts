import { z } from "zod";

export const AnalysisVerdictSchema = z.enum([
  "in_scope",
  "possible_scope_creep",
  "confirmed_scope_creep",
  "out_of_scope",
  "mixed",
]);

export const RiskLevelSchema = z.enum(["low", "medium", "high"]);
export const PrioritySchema = z.enum(["low", "medium", "high"]);

export const GeminiAnalysisResponseSchema = z.object({
  verdict: AnalysisVerdictSchema,
  confidence: z.number().min(0).max(100).default(85),
  riskLevel: RiskLevelSchema.default("low"),
  reasoning: z.string().default(""),
  executiveSummary: z.string().default(""),
  technicalExplanation: z.string().default(""),
  potentialRisks: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  addedRequirements: z.array(z.string()).default([]),
  removedRequirements: z.array(z.string()).default([]),
  modifiedRequirements: z.array(z.string()).default([]),
  missingRequirements: z.array(z.string()).default([]),
  estimatedExtraHours: z.number().min(0).default(0),
  estimatedExtraCost: z.number().min(0).default(0),
  timelineImpactDays: z.number().min(0).default(0),
  priority: PrioritySchema.default("medium"),
  clientFriendlinessScore: z.number().min(0).max(100).default(85),
  suggestedReply: z.string().default(""),
});

export type GeminiAnalysisResponse = z.infer<typeof GeminiAnalysisResponseSchema>;
