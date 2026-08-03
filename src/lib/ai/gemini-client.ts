import { GoogleGenAI } from "@google/genai";
import { buildScopeAnalysisPrompt, type AnalysisInputContext } from "./prompts";

export interface GeminiExecutionOptions {
  model?: string;
  temperature?: number;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface GeminiExecutionResult {
  rawResponseText: string;
  tokensUsed: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
  modelUsed: string;
}

/**
 * Server-only Gemini API Client wrapper using the official @google/genai SDK.
 */
export async function executeGeminiAnalysis(
  inputContext: AnalysisInputContext,
  options: GeminiExecutionOptions = {},
): Promise<GeminiExecutionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "mockup" || apiKey === "placeholder") {
    throw new Error("GEMINI_API_KEY is not configured or is set to mockup mode.");
  }

  const modelName = options.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const temperature = options.temperature ?? 0.2;
  const maxRetries = options.maxRetries ?? 3;
  const timeoutMs = options.timeoutMs ?? 20000;

  const { systemInstruction, promptText } = buildScopeAnalysisPrompt(inputContext);

  const ai = new GoogleGenAI({ apiKey });

  const startTime = Date.now();
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      // Execute request with timeout safety
      const requestPromise = ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          systemInstruction,
          temperature,
          responseMimeType: "application/json",
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      );

      const response = await Promise.race([requestPromise, timeoutPromise]);
      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;

      const rawResponseText = response.text || "";

      const usageMeta = response.usageMetadata;
      const tokensUsed = {
        inputTokens: usageMeta?.promptTokenCount ?? Math.ceil(promptText.length / 4),
        outputTokens: usageMeta?.candidatesTokenCount ?? Math.ceil(rawResponseText.length / 4),
        totalTokens:
          usageMeta?.totalTokenCount ??
          Math.ceil(promptText.length / 4) + Math.ceil(rawResponseText.length / 4),
      };

      return {
        rawResponseText,
        tokensUsed,
        processingTimeMs,
        modelUsed: modelName,
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[GeminiClient] Attempt ${attempt} failed: ${lastError.message}`);

      // Don't wait if it's the last attempt
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Gemini API request failed after retries.");
}
