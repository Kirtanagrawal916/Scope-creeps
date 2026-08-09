import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

// "gemini-3-flash" is NOT a valid model ID on its own — Gemini 3 Flash is
// still preview-stage, and Google's preview models require an explicit
// "-preview" suffix (e.g. gemini-3-flash-preview). Gemini 3.5 Flash has
// since reached GA and is Google's own recommended replacement for
// Gemini 3 Flash Preview, so it's used as the default here instead.
// Override in .env with GEMINI_MODEL if your project needs a different one.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// Created lazily and cached, so importing this file never throws even if
// GEMINI_API_KEY isn't set yet.
let client = null;

function getClient() {
  if (!env.geminiApiKey) return null;
  if (!client) {
    // Explicitly pin the stable v1 endpoint rather than relying on the
    // SDK's v1beta default, since GA models are guaranteed to be served
    // there and it removes ambiguity about which endpoint is being hit.
    client = new GoogleGenAI({
      apiKey: env.geminiApiKey,
      httpOptions: { apiVersion: "v1" },
    });
  }
  return client;
}

/**
 * Sends a single prompt to Gemini and returns the generated text.
 * Never throws — if the API key is missing or the request fails, it
 * returns a placeholder result instead, so callers don't need try/catch.
 *
 * Same public signature/return shape as before the SDK migration, so
 * nothing calling this function needs to change.
 *
 * @param {string} prompt
 * @returns {Promise<{ success: boolean, isPlaceholder: boolean, text: string|null, message: string|null }>}
 */
export async function generateResponse(prompt) {
  const ai = getClient();

  if (!ai) {
    return {
      success: false,
      isPlaceholder: true,
      text: null,
      message: "GEMINI_API_KEY is not configured.",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });

    return {
      success: true,
      isPlaceholder: false,
      text: response.text,
      message: null,
    };
  } catch (error) {
    return {
      success: false,
      isPlaceholder: true,
      text: null,
      message: `Gemini request failed: ${error.message}`,
    };
  }
}
