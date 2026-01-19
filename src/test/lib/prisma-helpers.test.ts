import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildSession } from "@/test/data/build-session";

import {
  UnauthorizedError,
  isUnauthorizedError,
  requireAuth,
} from "@/lib/prisma-helpers";

const getSessionMock = vi.hoisted(() => vi.fn());
const headersMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

describe("prisma-helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    test("When a session has a user, then it returns the user id and session", async () => {
      const userId = "user-203";
      const session = buildSession({ user: { id: userId } });
      const expected = { userId, session };
      headersMock.mockResolvedValue(new Headers());
      getSessionMock.mockResolvedValue(session);

      const result = await requireAuth();

      expect(result).toEqual(expected);
    });

    test("When a session lacks a user, then it throws an unauthorized error", async () => {
      const session = buildSession({ user: undefined });
      headersMock.mockResolvedValue(new Headers());
      getSessionMock.mockResolvedValue(session);

      const result = requireAuth();

      await expect(result).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("isUnauthorizedError", () => {
    test("When given an UnauthorizedError, then it returns true", () => {
      const error = new UnauthorizedError();

      const result = isUnauthorizedError(error);

      expect(result).toBe(true);
    });
  });
});
