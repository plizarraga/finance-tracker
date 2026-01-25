// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildCategory } from "@/__tests__/data/build-category";
import { buildCategoryFormData } from "@/__tests__/helpers/build-category-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getCategoriesMock = vi.hoisted(() => vi.fn());
const getCategoriesByTypeMock = vi.hoisted(() => vi.fn());
const categoryCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/categories/queries", () => ({
  getCategories: getCategoriesMock,
  getCategoriesByType: getCategoriesByTypeMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: { category: { create: categoryCreateMock } },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { GET, POST } from "@/app/api/categories/route";

describe("categories route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When listing categories by type, then it returns the filtered categories", async () => {
    const categories = [
      buildCategory({ id: "category-101", type: "income" }),
      buildCategory({ id: "category-102", name: "Bonus", type: "income" }),
    ];
    const expected = JSON.parse(JSON.stringify(categories));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getCategoriesByTypeMock.mockResolvedValue(categories);

    const response = await GET(new Request("http://localhost/api/categories?type=income"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When creating a category with invalid data, then it returns validation errors", async () => {
    const formData = buildCategoryFormData({ name: "" });
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    const request = new Request("http://localhost/api/categories", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ success: false, error: "Name is required" });
  });

  test("When creating a category, then it returns the created summary", async () => {
    const formData = buildCategoryFormData();
    const category = buildCategory({ id: "category-201", name: "Groceries" });
    requireAuthMock.mockResolvedValue({ userId: category.userId });
    categoryCreateMock.mockResolvedValue(category);
    const request = new Request("http://localhost/api/categories", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: { id: category.id, name: category.name },
    });
  });
});
