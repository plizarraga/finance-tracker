import { beforeEach, describe, expect, test, vi } from "vitest";

const createAuthClientMock = vi.hoisted(() => vi.fn());

vi.mock("better-auth/react", () => ({
  createAuthClient: createAuthClientMock,
}));

describe("auth-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_APP_URL;
    createAuthClientMock.mockReturnValue({
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      useSession: vi.fn(),
    });
  });

  test("When NEXT_PUBLIC_APP_URL is set, then it uses it as the base URL", async () => {
    const baseUrl = "https://finance.example.com";
    process.env.NEXT_PUBLIC_APP_URL = baseUrl;

    await import("@/lib/auth-client");

    expect(createAuthClientMock).toHaveBeenCalledWith({ baseURL: baseUrl });
  });

  test("When NEXT_PUBLIC_APP_URL is missing, then it uses the localhost base URL", async () => {
    const fallbackUrl = "http://localhost:3000";

    await import("@/lib/auth-client");

    expect(createAuthClientMock).toHaveBeenCalledWith({ baseURL: fallbackUrl });
  });
});
