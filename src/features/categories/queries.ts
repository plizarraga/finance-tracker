import { createServerClient } from "@/lib/db";
import { Category, CategoryRow, toCategory } from "@/types";

export async function getCategories(userId: string): Promise<Category[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return (data as CategoryRow[]).map(toCategory);
}

export async function getCategoriesByType(
  userId: string,
  type: "income" | "expense"
): Promise<Category[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories by type:", error);
    return [];
  }

  return (data as CategoryRow[]).map(toCategory);
}

export async function getCategoryById(
  id: string,
  userId: string
): Promise<Category | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return null;
  }

  return toCategory(data as CategoryRow);
}
