// @vitest-environment node
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildIncomeTemplate } from "@/__tests__/data/build-income-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const incomeTemplateFindManyMock = vi.hoisted(() => vi.fn());
const incomeTemplateFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    incomeTemplate: {
      findMany: incomeTemplateFindManyMock,
      findFirst: incomeTemplateFindFirstMock,
    },
  },
}));

import {
  getDefaultIncomeTemplate,
  getIncomeTemplateById,
  getIncomeTemplates,
} from "@/features/income-templates/queries";

describe("income templates queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting income templates, then it returns serialized templates", async () => {
    const userId = "user-203";
    const account = buildAccount({ id: "account-102", userId, initialBalance: new Prisma.Decimal(1250) });
    const category = buildCategory({ id: "category-102", userId, type: "income" });
    const template = buildIncomeTemplate({ userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(3500) });
    requireAuthMock.mockResolvedValue({ userId });
    incomeTemplateFindManyMock.mockResolvedValue([{ ...template, account, category }]);

    const result = await getIncomeTemplates();

    expect(incomeTemplateFindManyMock).toHaveBeenCalledWith({
      where: { userId },
      include: { account: true, category: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    expect(result).toEqual([
      {
        ...template,
        amount: template.amount?.toNumber() ?? null,
        account: { ...account, initialBalance: account.initialBalance.toNumber() },
        category,
      },
    ]);
  });

  test("When getting the default income template, then it returns the serialized template", async () => {
    const userId = "user-203";
    const account = buildAccount({ id: "account-103", userId, initialBalance: new Prisma.Decimal(500) });
    const category = buildCategory({ id: "category-103", userId, type: "income" });
    const template = buildIncomeTemplate({ id: "income-template-303", userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(1200) });
    requireAuthMock.mockResolvedValue({ userId });
    incomeTemplateFindFirstMock.mockResolvedValue({ ...template, account, category });

    const result = await getDefaultIncomeTemplate();

    expect(incomeTemplateFindFirstMock).toHaveBeenCalledWith({
      where: { userId, isDefault: true },
      include: { account: true, category: true },
    });
    expect(result).toEqual({
      ...template,
      amount: template.amount?.toNumber() ?? null,
      account: { ...account, initialBalance: account.initialBalance.toNumber() },
      category,
    });
  });

  test("When getting an income template by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const templateId = "income-template-404";
    const account = buildAccount({ id: "account-104", userId, initialBalance: new Prisma.Decimal(300) });
    const category = buildCategory({ id: "category-104", userId, type: "income" });
    const template = buildIncomeTemplate({ id: templateId, userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(900) });
    requireAuthMock.mockResolvedValue({ userId });
    incomeTemplateFindFirstMock.mockResolvedValue({ ...template, account, category });

    const result = await getIncomeTemplateById(templateId);

    expect(incomeTemplateFindFirstMock).toHaveBeenCalledWith({
      where: { id: templateId, userId },
      include: { account: true, category: true },
    });
    expect(result).toEqual({
      ...template,
      amount: template.amount?.toNumber() ?? null,
      account: { ...account, initialBalance: account.initialBalance.toNumber() },
      category,
    });
  });
});
