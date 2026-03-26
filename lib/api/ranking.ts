import { mapSupabaseError } from "@/lib/api/shared";
import { toMealComparison } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { MealComparisonRow } from "@/types/database";
import type { MealComparison } from "@/types/domain";

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
