// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const betterAuthMock = vi.hoisted(() => vi.fn());
const prismaAdapterMock = vi.hoisted(() => vi.fn());

class PrismaClientStub {}
class PrismaPgStub {}
class PoolStub {}

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: prismaAdapterMock,
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: PrismaClientStub,
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: PrismaPgStub,
}));

vi.mock("pg", () => ({
  Pool: PoolStub,
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  test("When initializing auth, then it configures the auth settings with the prisma adapter", async () => {
    const databaseUrl = "postgres://finance:ledger@localhost:5432/finance";
    const expectedConfig = {
      account: { modelName: "authAccount" },
      emailAndPassword: { enabled: true, minPasswordLength: 8 },
      session: { expiresIn: 604800, updateAge: 86400 },
    };
    const adapterValue = { source: "prisma-adapter" };
    vi.stubEnv("DATABASE_URL", databaseUrl);
    vi.stubEnv("NODE_ENV", "development");
    prismaAdapterMock.mockReturnValue(adapterValue);

    await import("@/lib/auth");

    expect(betterAuthMock).toHaveBeenCalledWith({
      ...expectedConfig,
      database: adapterValue,
    });
  });
});
