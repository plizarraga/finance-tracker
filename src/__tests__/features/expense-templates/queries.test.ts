// @vitest-environment node
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildAccount } from "@/__tests__/data/build-account";
import { buildCategory } from "@/__tests__/data/build-category";
import { buildExpenseTemplate } from "@/__tests__/data/build-expense-template";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const expenseTemplateFindManyMock = vi.hoisted(() => vi.fn());
const expenseTemplateFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    expenseTemplate: {
      findMany: expenseTemplateFindManyMock,
      findFirst: expenseTemplateFindFirstMock,
    },
  },
}));

import {
  getDefaultExpenseTemplate,
  getExpenseTemplateById,
  getExpenseTemplates,
} from "@/features/expense-templates/queries";

describe("expense templates queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting expense templates, then it returns serialized templates", async () => {
    const userId = "user-203";
    const account = buildAccount({ id: "account-102", userId, initialBalance: new Prisma.Decimal(1250) });
    const category = buildCategory({ id: "category-102", userId });
    const template = buildExpenseTemplate({ userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(75) });
    requireAuthMock.mockResolvedValue({ userId });
    expenseTemplateFindManyMock.mockResolvedValue([{ ...template, account, category }]);

    const result = await getExpenseTemplates();

    expect(expenseTemplateFindManyMock).toHaveBeenCalledWith({
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

  test("When getting the default expense template, then it returns the serialized template", async () => {
    const userId = "user-203";
    const account = buildAccount({ id: "account-103", userId, initialBalance: new Prisma.Decimal(500) });
    const category = buildCategory({ id: "category-103", userId });
    const template = buildExpenseTemplate({ id: "expense-template-303", userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(120) });
    requireAuthMock.mockResolvedValue({ userId });
    expenseTemplateFindFirstMock.mockResolvedValue({ ...template, account, category });

    const result = await getDefaultExpenseTemplate();

    expect(expenseTemplateFindFirstMock).toHaveBeenCalledWith({
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

  test("When getting an expense template by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const templateId = "expense-template-404";
    const account = buildAccount({ id: "account-104", userId, initialBalance: new Prisma.Decimal(300) });
    const category = buildCategory({ id: "category-104", userId });
    const template = buildExpenseTemplate({ id: templateId, userId, accountId: account.id, categoryId: category.id, amount: new Prisma.Decimal(90) });
    requireAuthMock.mockResolvedValue({ userId });
    expenseTemplateFindFirstMock.mockResolvedValue({ ...template, account, category });

    const result = await getExpenseTemplateById(templateId);

    expect(expenseTemplateFindFirstMock).toHaveBeenCalledWith({
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
