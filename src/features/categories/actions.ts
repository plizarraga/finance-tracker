"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/db";
import { ActionResult, Category, CategoryRow, toCategory } from "@/types";
import { categorySchema } from "./schemas";

export async function createCategory(
  formData: FormData
): Promise<ActionResult<Category>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    };

    const validationResult = categorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { name, type } = validationResult.data;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: session.user.id,
        name,
        type,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return { success: false, error: "Failed to create category" };
    }

    revalidatePath("/categories");

    return { success: true, data: toCategory(data as CategoryRow) };
  } catch (error) {
    console.error("Error in createCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult<Category>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    };

    const validationResult = categorySchema.safeParse(rawData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0].message,
      };
    }

    const { name, type } = validationResult.data;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return { success: false, error: "Failed to update category" };
    }

    revalidatePath("/categories");
    revalidatePath(`/categories/${id}/edit`);

    return { success: true, data: toCategory(data as CategoryRow) };
  } catch (error) {
    console.error("Error in updateCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error deleting category:", error);
      return { success: false, error: "Failed to delete category" };
    }

    revalidatePath("/categories");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
