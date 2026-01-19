import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatDateInput,
  getCurrentMonthRange,
  getCurrentYearRange,
  getPreviousMonthRange,
  parseDate,
} from "@/lib/format";

describe("format helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("formatCurrency", () => {
    test("When formatting a currency amount, then it returns a localized currency string", () => {
      const amount = 1234.5;
      const currency = "USD";
      const locale = "en-US";

      const result = formatCurrency(amount, currency, locale);

      expect(result).toBe("$1,234.50");
    });
  });

  describe("formatDate", () => {
    test("When formatting a date with options, then it returns the expected display string", () => {
      const date = "2024-02-03T00:00:00.000Z";
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      };
      const locale = "en-US";

      const result = formatDate(date, options, locale);

      expect(result).toBe("Feb 3, 2024");
    });
  });

  describe("formatDateInput", () => {
    test("When formatting a date for input, then it returns an ISO date string", () => {
      const date = new Date(2024, 1, 3);

      const result = formatDateInput(date);

      expect(result).toBe("2024-02-03");
    });
  });

  describe("parseDate", () => {
    test("When parsing a YYYY-MM-DD string, then it returns the matching local date", () => {
      const dateString = "2024-02-03";
      const expected = new Date(2024, 1, 3);

      const result = parseDate(dateString);

      expect(result.getTime()).toBe(expected.getTime());
    });

    test("When parsing an ISO timestamp, then it returns the corresponding date", () => {
      const dateString = "2024-02-03T10:20:30.000Z";
      const expected = new Date(dateString);

      const result = parseDate(dateString);

      expect(result.getTime()).toBe(expected.getTime());
    });

    test("When parsing an empty string, then it returns an invalid date", () => {
      const dateString = "";

      const result = parseDate(dateString);

      expect(Number.isNaN(result.getTime())).toBe(true);
    });
  });

  describe("getCurrentMonthRange", () => {
    test("When getting the current month range, then it returns the month start and end", () => {
      const now = new Date(2024, 2, 15);
      const expectedStart = new Date(2024, 2, 1);
      const expectedEnd = new Date(2024, 3, 0);
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const result = getCurrentMonthRange();

      expect(result).toEqual({ start: expectedStart, end: expectedEnd });
    });
  });

  describe("getPreviousMonthRange", () => {
    test("When getting the previous month range, then it returns the prior month start and end", () => {
      const now = new Date(2024, 2, 15);
      const expectedStart = new Date(2024, 1, 1);
      const expectedEnd = new Date(2024, 2, 0);
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const result = getPreviousMonthRange();

      expect(result).toEqual({ start: expectedStart, end: expectedEnd });
    });
  });

  describe("getCurrentYearRange", () => {
    test("When getting the current year range, then it returns the year start and end", () => {
      const now = new Date(2024, 6, 10);
      const expectedStart = new Date(2024, 0, 1);
      const expectedEnd = new Date(2024, 11, 31);
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const result = getCurrentYearRange();

      expect(result).toEqual({ start: expectedStart, end: expectedEnd });
    });
  });
});
