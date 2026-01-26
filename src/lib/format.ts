/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale: string = "en-US"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

function getDateOnlyParts(date: Date | string): { year: number; month: number; day: number } {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const [year, month, day] = date.trim().split("-").map(Number);
    return { year, month, day };
  }
  const d = typeof date === "string" ? new Date(date) : date;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Format a date-only value for display (avoids timezone shifts).
 */
export function formatDateOnly(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  locale: string = "en-US"
): string {
  const { year, month, day } = getDateOnlyParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(utcDate);
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateInput(date: Date | string): string {
  const { year, month, day } = getDateOnlyParts(date);
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Parse a date string to Date object
 */
export function parseDate(dateString: string): Date {
  if (!dateString) {
    return new Date(NaN);
  }
  if (dateString.includes("T")) {
    return new Date(dateString);
  }
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date(dateString);
  }
  return new Date(year, month - 1, day);
}

/**
 * Get start and end of current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

/**
 * Get start and end of previous month
 */
export function getPreviousMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start, end };
}

/**
 * Get start and end of current year
 */
export function getCurrentYearRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return { start, end };
}
