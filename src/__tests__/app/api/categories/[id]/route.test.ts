// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildCategory } from "@/__tests__/data/build-category";
import { buildCategoryFormData } from "@/__tests__/helpers/build-category-form-data";

const requireAuthMock = vi.hoisted(() => vi.fn());
const getCategoryByIdMock = vi.hoisted(() => vi.fn());
const categoryFindFirstMock = vi.hoisted(() => vi.fn());
const categoryUpdateMock = vi.hoisted(() => vi.fn());
const categoryDeleteMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma-helpers", () => ({
  requireAuth: requireAuthMock,
  isUnauthorizedError: vi.fn(),
}));

vi.mock("@/features/categories/queries", () => ({
  getCategoryById: getCategoryByIdMock,
}));

vi.mock("@/lib/auth", () => ({
  prisma: {
    category: {
      findFirst: categoryFindFirstMock,
      update: categoryUpdateMock,
      delete: categoryDeleteMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { DELETE, GET, PUT } from "@/app/api/categories/[id]/route";

describe("categories id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("When fetching a category by id, then it returns the category payload", async () => {
    const category = buildCategory({ id: "category-301" });
    const expected = JSON.parse(JSON.stringify(category));
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    getCategoryByIdMock.mockResolvedValue(category);
    const params = Promise.resolve({ id: category.id });

    const response = await GET(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(expected);
  });

  test("When updating a missing category, then it returns not found", async () => {
    const formData = buildCategoryFormData();
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    categoryFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "category-404" });
    const request = new Request("http://localhost", {
      method: "PUT",
      body: formData,
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Category not found" });
  });

  test("When deleting a missing category, then it returns not found", async () => {
    requireAuthMock.mockResolvedValue({ userId: "user-203" });
    categoryFindFirstMock.mockResolvedValue(null);
    const params = Promise.resolve({ id: "category-404" });

    const response = await DELETE(new Request("http://localhost"), { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: "Category not found" });
  });
});
