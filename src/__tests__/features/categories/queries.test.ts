// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildCategory } from "@/__tests__/data/build-category";

const requireAuthMock = vi.hoisted(() => vi.fn());
const isUnauthorizedErrorMock = vi.hoisted(() => vi.fn());
const categoryFindManyMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: isUnauthorizedErrorMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    category: {
      findMany: categoryFindManyMock,
      findFirst: categoryFindFirstMock,
    },
  },
}));

import {
  getCategories,
  getCategoriesByType,
  getCategoryById,
} from "@/features/categories/queries";

describe("categories queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUnauthorizedErrorMock.mockReturnValue(false);
  });

  test("When getting categories, then it returns the user categories ordered by name", async () => {
    const userId = "user-203";
    const categories = [
      buildCategory({ id: "category-101", userId }),
      buildCategory({ id: "category-102", userId, name: "Salary", type: "income" }),
    ];
    requireAuthMock.mockResolvedValue({ userId });
    categoryFindManyMock.mockResolvedValue(categories);

    const result = await getCategories();

    expect(categoryFindManyMock).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { name: "asc" },
    });
    expect(result).toEqual(categories);
  });

  test("When getting categories by type, then it scopes by user id and type", async () => {
    const userId = "user-203";
    const type = "income";
    const categories = [
      buildCategory({ id: "category-201", userId, type, name: "Salary" }),
      buildCategory({ id: "category-202", userId, type, name: "Bonus" }),
    ];
    requireAuthMock.mockResolvedValue({ userId });
    categoryFindManyMock.mockResolvedValue(categories);

    const result = await getCategoriesByType(type);

    expect(categoryFindManyMock).toHaveBeenCalledWith({
      where: { userId, type },
      orderBy: { name: "asc" },
    });
    expect(result).toEqual(categories);
  });

  test("When getting a category by id, then it scopes by user id", async () => {
    const userId = "user-203";
    const categoryId = "category-303";
    const category = buildCategory({ id: categoryId, userId });
    requireAuthMock.mockResolvedValue({ userId });
    categoryFindFirstMock.mockResolvedValue(category);

    const result = await getCategoryById(categoryId);

    expect(categoryFindFirstMock).toHaveBeenCalledWith({
      where: { id: categoryId, userId },
    });
    expect(result).toEqual(category);
  });
});
