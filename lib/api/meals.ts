import { mapSupabaseError } from "@/lib/api/shared";
import { toMeal, toRecipe, toUserProfile } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { MealRow, ProfileRow, RecipeRow } from "@/types/database";
import type { Meal, Recipe, UserProfile } from "@/types/domain";

export type MealDetail = {
  meal: Meal;
  owner: UserProfile;
  recipe: Recipe | null;
};

export async function getMealById(mealId: string): Promise<MealDetail> {
  const supabase = getSupabaseClient();
  const { data: mealData, error: mealError } = await supabase
    .from("meals")
    .select("*")
    .eq("id", mealId)
    .single<MealRow>();

  mapSupabaseError(mealError, "Failed to load meal.");
  if (!mealData) {
    throw new Error("Failed to load meal.");
  }

  const meal = toMeal(mealData);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", mealData.owner_id)
    .single<ProfileRow>();

  mapSupabaseError(profileError, "Failed to load meal owner.");
  if (!profileData) {
    throw new Error("Failed to load meal owner.");
  }

  const owner = toUserProfile(profileData);

  let recipe: Recipe | null = null;
  if (mealData.recipe_id) {
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("*, recipe_ingredients(*), recipe_steps(*)")
      .eq("id", mealData.recipe_id)
      .single<RecipeRow>();

    if (!recipeError && recipeData) {
      recipe = toRecipe(recipeData);
    }
  }

  return { meal, owner, recipe };
}

export async function listMeals(ownerId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("owner_id", ownerId)
    .order("rank_position", { ascending: true });

  mapSupabaseError(error, "Failed to load meals.");
  return (data ?? []).map((row) => toMeal(row as MealRow));
}

export async function createMeal(
  meal: Pick<Meal, "ownerId" | "recipeId" | "title" | "caption" | "heroImageUrl" | "visibility">
) {
  const supabase = getSupabaseClient();
  const { count, error: countError } = await supabase
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", meal.ownerId);

  mapSupabaseError(countError, "Failed to calculate meal rank.");

  const { data, error } = await supabase.from("meals").insert({
    owner_id: meal.ownerId,
    recipe_id: meal.recipeId,
    title: meal.title,
    caption: meal.caption,
    hero_image_url: meal.heroImageUrl,
    visibility: meal.visibility,
    rank_position: (count ?? 0) + 1
  }).select("*").single<MealRow>();

  mapSupabaseError(error, "Failed to create meal.");
  if (!data) {
    throw new Error("Failed to create meal.");
  }
  return toMeal(data);
}

export async function updateMealRankOrder(ownerId: string, orderedMealIds: string[]) {
  const supabase = getSupabaseClient();

  for (const [index, mealId] of orderedMealIds.entries()) {
    const { error } = await supabase
      .from("meals")
      .update({ rank_position: index + 1 })
      .eq("id", mealId)
      .eq("owner_id", ownerId);

    mapSupabaseError(error, "Failed to update meal ranks.");
  }
}

export async function applyRankedOrder(ownerId: string, orderedMealIds: string[]): Promise<void> {
  return updateMealRankOrder(ownerId, orderedMealIds);
}
