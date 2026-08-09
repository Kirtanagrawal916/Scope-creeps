/**
 * ai-usage.server.ts — Admin-only AI Usage metrics (Phase 6).
 *
 * Reuses the existing Gemini integration's persisted output — every call to
 * analyzeScopeWithAI() (src/lib/ai/service.ts) already gets saved onto an
 * Analysis document via analyses.server.ts, including tokensUsed,
 * processingTime and isFallback. This module only reads that data; it does
 * not call Gemini, does not duplicate ai/service.ts, and does not add any
 * new tracking columns.
 *
 * IMPORTANT — what "success" and "failure" mean here:
 * analyzeScopeWithAI() ALWAYS returns a usable result to the caller: if the
 * Gemini API call fails for any reason, it is caught internally and the
 * function transparently falls back to a rule-based analysis (isFallback:
 * true) rather than throwing. So:
 *   - "successful request"  = isFallback === false (Gemini responded)
 *   - "failed request"      = isFallback === true  (Gemini call failed,
 *                              rule-based fallback was used instead)
 * There is currently no tracking of AI calls that never resulted in a saved
 * Analysis document at all (e.g. a crash before persistence) — that data
 * does not exist anywhere in the project, so it is NOT included below
 * rather than being estimated.
 */
import { createServerFn } from "@tanstack/react-start";
import { connectToDatabase } from "./db";
import { Analysis } from "../models/Analysis";
import { requireAdmin } from "./authorize.server";

export type AiUsageMetrics = {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  /** Percentage (0–100), rounded to 1 decimal. null if there are zero requests. */
  successRate: number | null;
  /** Average processingTime across all requests, in ms. null if there are zero requests. */
  averageResponseTimeMs: number | null;
  totalTokensUsed: number;
  /** null if there are zero requests. */
  averageTokensPerRequest: number | null;
};

export const getAiUsageMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<AiUsageMetrics> => {
    await requireAdmin();
    await connectToDatabase();

    const [totalRequests, successfulRequests, aggregate] = await Promise.all([
      Analysis.countDocuments(),
      Analysis.countDocuments({ isFallback: { $ne: true } }),
      Analysis.aggregate<{ _id: null; avgTime: number | null; totalTokens: number | null }>([
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$processingTime" },
            totalTokens: { $sum: "$tokensUsed.totalTokens" },
          },
        },
      ]),
    ]);

    const failedRequests = totalRequests - successfulRequests;
    const stats = aggregate[0];
    const totalTokensUsed = stats?.totalTokens ?? 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate:
        totalRequests > 0 ? Number(((successfulRequests / totalRequests) * 100).toFixed(1)) : null,
      averageResponseTimeMs:
        totalRequests > 0 && stats?.avgTime != null ? Math.round(stats.avgTime) : null,
      totalTokensUsed,
      averageTokensPerRequest:
        totalRequests > 0 ? Math.round(totalTokensUsed / totalRequests) : null,
    };
  },
);
