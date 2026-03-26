import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
  note: z.string()
});

const stepSchema = z.object({
  instructionText: z.string()
});

export const recipeFormSchema = z.object({
  title: z.string().min(2, "Recipe title must be at least 2 characters."),
  description: z.string(),
  cuisine: z.string(),
  servings: z.string(),
  prepTimeMinutes: z.string(),
  cookTimeMinutes: z.string(),
  tags: z.string(),
  dietaryLabels: z.string(),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient."),
  steps: z.array(stepSchema).min(1, "Add at least one step."),
  status: z.enum(["draft", "published"])
});

export const mealFormSchema = z.object({
  recipeId: z.string().min(1, "Choose a recipe."),
  title: z.string().min(2, "Meal title must be at least 2 characters."),
  caption: z.string(),
  heroImageUrl: z.string(),
  visibility: z.enum(["public", "followers", "private"])
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
export type MealFormValues = z.infer<typeof mealFormSchema>;
