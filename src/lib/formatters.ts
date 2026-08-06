import { APP_CONFIG } from "@/config/app.config";

/**
 * Formats a numeric amount using the specified currency symbol and locale.
 * Default fallback is taken from APP_CONFIG or user settings.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currencySymbol: string = APP_CONFIG.defaultCurrencySymbol,
  locale: string = APP_CONFIG.defaultLocale,
): string {
  const val = amount ?? 0;

  try {
    // If currency symbol is known, format cleanly with symbol prefix
    const formattedNum = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);

    return `${currencySymbol}${formattedNum}`;
  } catch {
    return `${currencySymbol}${val.toLocaleString()}`;
  }
}

/**
 * Formats hours into human readable text (e.g. "12h" or "12.5 hrs").
 */
export function formatHours(hours: number | undefined | null): string {
  const val = hours ?? 0;
  return `${val}h`;
}

/**
 * Formats numbers into percentages (e.g. "85%").
 */
export function formatPercentage(val: number | undefined | null): string {
  const num = val ?? 0;
  return `${Math.round(num)}%`;
}

/**
 * Formats large numbers compactly (e.g. $1.2k, $45k).
 */
export function formatCompactNumber(
  amount: number | undefined | null,
  currencySymbol: string = APP_CONFIG.defaultCurrencySymbol,
): string {
  const val = amount ?? 0;
  if (val >= 1_000_000) {
    return `${currencySymbol}${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `${currencySymbol}${(val / 1_000).toFixed(1)}k`;
  }
  return `${currencySymbol}${val}`;
}

/**
 * Derive user initials from first name / last name or email.
 */
export function getInitials(
  firstName?: string,
  lastName?: string,
  email?: string,
): string {
  if (firstName && firstName.trim()) {
    const first = firstName.trim()[0];
    const last = lastName && lastName.trim() ? lastName.trim()[0] : "";
    return `${first}${last}`.toUpperCase();
  }
  if (email && email.includes("@")) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}
