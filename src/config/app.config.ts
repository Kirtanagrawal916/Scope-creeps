/**
 * app.config.ts — Centralized Application & Enterprise SaaS Configuration
 *
 * Contains all global settings, default workspace values, magic numbers, pagination caps,
 * timeout limits, and AI model constants.
 */

export const APP_CONFIG = {
  name: "ScopeGuard",
  tagline: "Enterprise Scope Creep & Contract Protection Platform",
  companyName: "ScopeGuard Inc.",
  supportEmail: "support@scopeguard.io",
  version: "1.0.0",

  // Workspace & Currency Defaults
  defaultCurrency: "INR",
  defaultCurrencySymbol: "₹",
  defaultLocale: "en-IN",
  defaultTimezone: "UTC",
  defaultLanguage: "en",
  defaultHourlyRate: 150,
  defaultDateFormat: "MMM d, yyyy",

  // Supported Currencies
  supportedCurrencies: [
    { code: "USD", symbol: "$", label: "USD ($) - US Dollar", locale: "en-US" },
    { code: "EUR", symbol: "€", label: "EUR (€) - Euro", locale: "de-DE" },
    { code: "GBP", symbol: "£", label: "GBP (£) - British Pound", locale: "en-GB" },
    { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee", locale: "en-IN" },
    { code: "CAD", symbol: "CA$", label: "CAD (CA$) - Canadian Dollar", locale: "en-CA" },
    { code: "AUD", symbol: "A$", label: "AUD (A$) - Australian Dollar", locale: "en-AU" },
  ],

  // Pagination & Limits
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    searchLimit: 30,
    recentHistoryLimit: 10,
    recentProjectsLimit: 5,
  },

  // Performance & Timing
  debounceMs: 250,
  toastDurationMs: 3000,
  maxSearchQueryLength: 100,

  // AI Analysis Settings
  ai: {
    defaultModel: "gemini-2.5-flash",
    fallbackModel: "gemini-2.0-flash",
    promptVersion: "v1.0",
    maxTokens: 2048,
    temperature: 0.2,
  },

  // Export Settings
  export: {
    maxExportRows: 1000,
    defaultScope: "workspace",
    formats: ["csv", "json", "pdf", "xlsx", "docx", "zip"] as const,
  },
} as const;
