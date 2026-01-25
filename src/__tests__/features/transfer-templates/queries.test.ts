// @vitest-environment node
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildTransferTemplate } from "@/__tests__/data/build-transfer-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const transferTemplateFindManyMock = vi.hoisted(() => vi.fn());
const transferTemplateFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    transferTemplate: {
      findMany: transferTemplateFindManyMock,
      findFirst: transferTemplateFindFirstMock,
    },
  },
}));

import {
  getDefaultTransferTemplate,
  getTransferTemplateById,
  getTransferTemplates,
} from "@/features/transfer-templates/queries";

describe("transfer templates queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When getting transfer templates, then it returns serialized templates", async () => {
    const userId = "user-203";
    const fromAccount = buildAccount({ id: "account-102", userId, initialBalance: new Prisma.Decimal(1250) });
    const toAccount = buildAccount({ id: "account-103", userId, name: "Savings", initialBalance: new Prisma.Decimal(300) });
    const template = buildTransferTemplate({ userId, fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: new Prisma.Decimal(200) });
    requireAuthMock.mockResolvedValue({ userId });
    transferTemplateFindManyMock.mockResolvedValue([{ ...template, fromAccount, toAccount }]);

    const result = await getTransferTemplates();

    expect(transferTemplateFindManyMock).toHaveBeenCalledWith({
      where: { userId },
      include: { fromAccount: true, toAccount: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    expect(result).toEqual([
      {
        ...template,
        amount: template.amount?.toNumber() ?? null,
        fromAccount: { ...fromAccount, initialBalance: fromAccount.initialBalance.toNumber() },
        toAccount: { ...toAccount, initialBalance: toAccount.initialBalance.toNumber() },
      },
    ]);
  });

  test("When getting the default transfer template, then it returns the serialized template", async () => {
    const userId = "user-203";
    const fromAccount = buildAccount({ id: "account-104", userId, initialBalance: new Prisma.Decimal(900) });
    const toAccount = buildAccount({ id: "account-105", userId, name: "Emergency", initialBalance: new Prisma.Decimal(150) });
    const template = buildTransferTemplate({ id: "transfer-template-303", userId, fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: new Prisma.Decimal(400) });
    requireAuthMock.mockResolvedValue({ userId });
    transferTemplateFindFirstMock.mockResolvedValue({ ...template, fromAccount, toAccount });

    const result = await getDefaultTransferTemplate();

    expect(transferTemplateFindFirstMock).toHaveBeenCalledWith({
      where: { userId, isDefault: true },
      include: { fromAccount: true, toAccount: true },
    });
    expect(result).toEqual({
      ...template,
      amount: template.amount?.toNumber() ?? null,
      fromAccount: { ...fromAccount, initialBalance: fromAccount.initialBalance.toNumber() },
      toAccount: { ...toAccount, initialBalance: toAccount.initialBalance.toNumber() },
    });
  });

  test("When getting a transfer template by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const templateId = "transfer-template-404";
    const fromAccount = buildAccount({ id: "account-106", userId, initialBalance: new Prisma.Decimal(1200) });
    const toAccount = buildAccount({ id: "account-107", userId, name: "Vacation", initialBalance: new Prisma.Decimal(250) });
    const template = buildTransferTemplate({ id: templateId, userId, fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: new Prisma.Decimal(600) });
    requireAuthMock.mockResolvedValue({ userId });
    transferTemplateFindFirstMock.mockResolvedValue({ ...template, fromAccount, toAccount });

    const result = await getTransferTemplateById(templateId);

    expect(transferTemplateFindFirstMock).toHaveBeenCalledWith({
      where: { id: templateId, userId },
      include: { fromAccount: true, toAccount: true },
    });
    expect(result).toEqual({
      ...template,
      amount: template.amount?.toNumber() ?? null,
      fromAccount: { ...fromAccount, initialBalance: fromAccount.initialBalance.toNumber() },
      toAccount: { ...toAccount, initialBalance: toAccount.initialBalance.toNumber() },
    });
  });
});
