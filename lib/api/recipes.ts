import { mapSupabaseError } from "@/lib/api/shared";
import { toRecipe } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { RecipeIngredientRow, RecipeRow, RecipeStepRow } from "@/types/database";
import type { Recipe, RecipeIngredient, RecipeStep } from "@/types/domain";

export type UpdateRecipeInput = Partial<
  Pick<
    Recipe,
    "title" | "description" | "coverImageUrl" | "cuisine" | "servings" | "prepTimeMinutes" | "cookTimeMinutes" | "tags" | "dietaryLabels" | "status"
  >
> & {
  ingredients?: Array<Pick<RecipeIngredient, "name" | "quantity" | "unit" | "note">>;
  steps?: Array<Pick<RecipeStep, "instructionText" | "ingredientReferences" | "imageUrl">>;
};

const recipeSelect = `
  *,
  recipe_ingredients (*),
  recipe_steps (*)
`;

export type CreateRecipeInput = Pick<
  Recipe,
  "ownerId" | "title" | "description" | "coverImageUrl" | "cuisine" | "servings" | "prepTimeMinutes" | "cookTimeMinutes" | "tags" | "dietaryLabels" | "status"
> & {
  ingredients: Array<Pick<RecipeIngredient, "name" | "quantity" | "unit" | "note">>;
  steps: Array<Pick<RecipeStep, "instructionText" | "ingredientReferences" | "imageUrl">>;
};

export async function getRecipeById(recipeId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recipes").select(recipeSelect).eq("id", recipeId).single<RecipeRow>();

  mapSupabaseError(error, "Failed to load recipe.");
  if (!data) {
    throw new Error("Failed to load recipe.");
  }

  return toRecipe(data);
}

export async function listRecipes(ownerId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(recipeSelect)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  mapSupabaseError(error, "Failed to load recipes.");
  return (data ?? []).map((row) => toRecipe(row as RecipeRow));
}

export async function createRecipe(recipe: CreateRecipeInput) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recipes").insert({
    owner_id: recipe.ownerId,
    title: recipe.title,
    description: recipe.description,
    cover_image_url: recipe.coverImageUrl,
    cuisine: recipe.cuisine,
    servings: recipe.servings,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    tags: recipe.tags,
    dietary_labels: recipe.dietaryLabels,
    status: recipe.status
  }).select("id").single<{ id: string }>();

  mapSupabaseError(error, "Failed to create recipe.");
  if (!data) {
    throw new Error("Failed to create recipe.");
  }

  const ingredientsToInsert = recipe.ingredients
    .filter((ingredient) => ingredient.name.trim().length > 0)
    .map((ingredient, index) => ({
      recipe_id: data.id,
      order_index: index,
      name: ingredient.name.trim(),
      quantity: ingredient.quantity?.trim() || null,
      unit: ingredient.unit?.trim() || null,
      note: ingredient.note?.trim() || null
    }));

  const ingredientIdsByIndex: string[] = [];
  if (ingredientsToInsert.length > 0) {
    const { data: insertedIngredients, error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert)
      .select("id, order_index")
      .returns<{ id: string; order_index: number }[]>();
    mapSupabaseError(ingredientError, "Failed to save recipe ingredients.");
    for (const row of insertedIngredients ?? []) {
      ingredientIdsByIndex[row.order_index] = row.id;
    }
  }

  const stepsToInsert = recipe.steps
    .filter((step) => step.instructionText.trim().length > 0)
    .map((step, index) => ({
      recipe_id: data.id,
      order_index: index,
      instruction_text: step.instructionText.trim(),
      ingredient_references: step.ingredientReferences
        .map((ref) => ingredientIdsByIndex[parseInt(ref, 10)])
        .filter(Boolean),
      image_url: step.imageUrl?.trim() || null
    }));

  if (stepsToInsert.length > 0) {
    const { error: stepError } = await supabase.from("recipe_steps").insert(stepsToInsert).select("id").returns<RecipeStepRow[]>();
    mapSupabaseError(stepError, "Failed to save recipe steps.");
  }

  return getRecipeById(data.id);
}

export async function updateRecipe(recipeId: string, input: UpdateRecipeInput): Promise<Recipe> {
  const supabase = getSupabaseClient();

  const updatePayload: Record<string, unknown> = {};
  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.coverImageUrl !== undefined) updatePayload.cover_image_url = input.coverImageUrl;
  if (input.cuisine !== undefined) updatePayload.cuisine = input.cuisine;
  if (input.servings !== undefined) updatePayload.servings = input.servings;
  if (input.prepTimeMinutes !== undefined) updatePayload.prep_time_minutes = input.prepTimeMinutes;
  if (input.cookTimeMinutes !== undefined) updatePayload.cook_time_minutes = input.cookTimeMinutes;
  if (input.tags !== undefined) updatePayload.tags = input.tags;
  if (input.dietaryLabels !== undefined) updatePayload.dietary_labels = input.dietaryLabels;
  if (input.status !== undefined) updatePayload.status = input.status;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from("recipes").update(updatePayload).eq("id", recipeId);
    mapSupabaseError(error, "Failed to update recipe.");
  }

  if (input.ingredients !== undefined) {
    const { error: deleteError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    mapSupabaseError(deleteError, "Failed to remove old ingredients.");

    const ingredientsToInsert = input.ingredients
      .filter((ingredient) => ingredient.name.trim().length > 0)
      .map((ingredient, index) => ({
        recipe_id: recipeId,
        order_index: index,
        name: ingredient.name.trim(),
        quantity: ingredient.quantity?.trim() || null,
        unit: ingredient.unit?.trim() || null,
        note: ingredient.note?.trim() || null
      }));

    const ingredientIdsByIndex: string[] = [];
    if (ingredientsToInsert.length > 0) {
      const { data: insertedIngredients, error: insertError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientsToInsert)
        .select("id, order_index")
        .returns<{ id: string; order_index: number }[]>();
      mapSupabaseError(insertError, "Failed to save updated ingredients.");
      for (const row of insertedIngredients ?? []) {
        ingredientIdsByIndex[row.order_index] = row.id;
      }
    }

    if (input.steps !== undefined) {
      const { error: deleteError } = await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);
      mapSupabaseError(deleteError, "Failed to remove old steps.");

      const stepsToInsert = input.steps
        .filter((step) => step.instructionText.trim().length > 0)
        .map((step, index) => ({
          recipe_id: recipeId,
          order_index: index,
          instruction_text: step.instructionText.trim(),
          ingredient_references: step.ingredientReferences
            .map((ref) => ingredientIdsByIndex[parseInt(ref, 10)])
            .filter(Boolean),
          image_url: step.imageUrl?.trim() || null
        }));

      if (stepsToInsert.length > 0) {
        const { error: insertError } = await supabase.from("recipe_steps").insert(stepsToInsert).select("id").returns<RecipeStepRow[]>();
        mapSupabaseError(insertError, "Failed to save updated steps.");
      }
    }
  } else if (input.steps !== undefined) {
    // Steps changed but ingredients didn't — fetch existing ingredient IDs from DB.
    const { data: existingIngredients } = await supabase
      .from("recipe_ingredients")
      .select("id, order_index")
      .eq("recipe_id", recipeId)
      .returns<{ id: string; order_index: number }[]>();

    const ingredientIdsByIndex: string[] = [];
    for (const row of existingIngredients ?? []) {
      ingredientIdsByIndex[row.order_index] = row.id;
    }

    const { error: deleteError } = await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);
    mapSupabaseError(deleteError, "Failed to remove old steps.");

    const stepsToInsert = input.steps
      .filter((step) => step.instructionText.trim().length > 0)
      .map((step, index) => ({
        recipe_id: recipeId,
        order_index: index,
        instruction_text: step.instructionText.trim(),
        ingredient_references: step.ingredientReferences
          .map((ref) => ingredientIdsByIndex[parseInt(ref, 10)])
          .filter(Boolean),
        image_url: step.imageUrl?.trim() || null
      }));

    if (stepsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("recipe_steps").insert(stepsToInsert).select("id").returns<RecipeStepRow[]>();
      mapSupabaseError(insertError, "Failed to save updated steps.");
    }
  }

  return getRecipeById(recipeId);
}
