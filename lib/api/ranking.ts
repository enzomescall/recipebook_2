import { mapSupabaseError } from "@/lib/api/shared";
import { toMealComparison } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { updateRecipeRankOrder } from "@/lib/api/recipes";
import type { MealComparisonRow } from "@/types/database";
import type { MealComparison, RecipeComparison } from "@/types/domain";

export async function recordMealComparison(comparison: Pick<MealComparison, "userId" | "subjectMealId" | "comparedAgainstMealId" | "preferredMealId">) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("meal_comparisons").insert({
    user_id: comparison.userId,
    subject_meal_id: comparison.subjectMealId,
    compared_against_meal_id: comparison.comparedAgainstMealId,
    preferred_meal_id: comparison.preferredMealId
  }).select("*").single<MealComparisonRow>();

  mapSupabaseError(error, "Failed to record comparison.");
  if (!data) {
    throw new Error("Failed to record comparison.");
  }
  return toMealComparison(data);
}

export async function recordRecipeComparison(
  comparison: Pick<RecipeComparison, "userId" | "subjectRecipeId" | "comparedAgainstRecipeId" | "preferredRecipeId">
): Promise<RecipeComparison> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recipe_comparisons").insert({
    user_id: comparison.userId,
    subject_recipe_id: comparison.subjectRecipeId,
    compared_against_recipe_id: comparison.comparedAgainstRecipeId,
    preferred_recipe_id: comparison.preferredRecipeId
  }).select("*").single<{ id: string; user_id: string; subject_recipe_id: string; compared_against_recipe_id: string; preferred_recipe_id: string; created_at: string }>();

  mapSupabaseError(error, "Failed to record recipe comparison.");
  if (!data) throw new Error("Failed to record recipe comparison.");
  return {
    id: data.id,
    userId: data.user_id,
    subjectRecipeId: data.subject_recipe_id,
    comparedAgainstRecipeId: data.compared_against_recipe_id,
    preferredRecipeId: data.preferred_recipe_id,
    createdAt: data.created_at
  };
}

export async function applyRecipeRankedOrder(ownerId: string, orderedRecipeIds: string[]): Promise<void> {
  return updateRecipeRankOrder(ownerId, orderedRecipeIds);
}
