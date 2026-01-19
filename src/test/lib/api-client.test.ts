import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildActionResult } from "@/test/data/build-action-result";
import { buildConfirmation } from "@/test/data/build-confirmation";

import { submitForm, submitJson } from "@/lib/api-client";

describe("api-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("submitForm", () => {
    test("When the response includes a success payload, then it returns the action result", async () => {
      const url = "/api/expenses";
      const method = "POST";
      const confirmation = buildConfirmation();
      const expected = buildActionResult({ success: true, data: confirmation });
      const response = new Response(JSON.stringify(expected), { status: 200 });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      const result = await submitForm<typeof confirmation>(
        url,
        method,
        new FormData()
      );

      expect(result).toEqual(expected);
    });
  });

  describe("submitJson", () => {
    test("When the response includes an error message, then it returns a failure result", async () => {
      const url = "/api/expenses";
      const method = "POST";
      const errorMessage = "Balance exceeded for payroll account";
      const expected = buildActionResult({ success: false, error: errorMessage });
      const response = new Response(JSON.stringify(expected), { status: 400 });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      const result = await submitJson(url, method, { memo: "Payroll" });

      expect(result).toEqual(expected);
    });

    test("When the response is not ok and has no payload, then it returns a status error", async () => {
      const url = "/api/expenses";
      const method = "POST";
      const statusText = "Service Unavailable";
      const response = new Response(null, { status: 503, statusText });
      const fetchMock = vi.fn().mockResolvedValue(response);
      vi.stubGlobal("fetch", fetchMock);

      const result = await submitJson(url, method);

      expect(result).toEqual({ success: false, error: statusText });
    });
  });
});
