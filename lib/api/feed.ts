import { getSupabaseClient } from "@/lib/supabase/client";
import { mapSupabaseError } from "@/lib/api/shared";

export interface FeedItem {
  mealId: string;
  mealTitle: string;
  mealCaption: string | null;
  mealHeroImageUrl: string | null;
  mealVisibility: "public" | "followers" | "private";
  mealRankPosition: number | null;
  mealCreatedAt: string;
  ownerId: string;
  ownerUsername: string;
  ownerDisplayName: string;
  ownerProfileImageUrl: string | null;
  recipeId: string;
  recipeTitle: string;
  recipeCoverImageUrl: string | null;
  recipeCuisine: string | null;
}

type MealJoinRow = {
  id: string;
  title: string;
  caption: string | null;
  hero_image_url: string | null;
  visibility: "public" | "followers" | "private";
  rank_position: number | null;
  created_at: string;
  owner_id: string;
  recipe_id: string;
  profiles: {
    username: string;
    display_name: string;
    profile_image_url: string | null;
  } | null;
  recipes: {
    title: string;
    cover_image_url: string | null;
    cuisine: string | null;
  } | null;
};

// Fetch public feed items with owner + recipe joined.
export async function getFeedItems(params?: {
  limit?: number;
  offset?: number;
  userId?: string;
}): Promise<FeedItem[]> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  const userId = params?.userId;

  const supabase = getSupabaseClient();

  let query = supabase
    .from("meals")
    .select(
      `id,
       title,
       caption,
       hero_image_url,
       visibility,
       rank_position,
       created_at,
       owner_id,
       recipe_id,
       profiles!owner_id ( username, display_name, profile_image_url ),
       recipes ( title, cover_image_url, cuisine )`
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq("owner_id", userId);
  } else {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;

  mapSupabaseError(error, "Failed to load feed items.");

  return (data ?? []).flatMap((row) => {
    const meal = row as unknown as MealJoinRow;

    if (!meal.profiles || !meal.recipes) {
      return [];
    }

    return [
      {
        mealId: meal.id,
        mealTitle: meal.title,
        mealCaption: meal.caption,
        mealHeroImageUrl: meal.hero_image_url,
        mealVisibility: meal.visibility,
        mealRankPosition: meal.rank_position,
        mealCreatedAt: meal.created_at,
        ownerId: meal.owner_id,
        ownerUsername: meal.profiles.username,
        ownerDisplayName: meal.profiles.display_name,
        ownerProfileImageUrl: meal.profiles.profile_image_url,
        recipeId: meal.recipe_id,
        recipeTitle: meal.recipes.title,
        recipeCoverImageUrl: meal.recipes.cover_image_url,
        recipeCuisine: meal.recipes.cuisine
      } satisfies FeedItem
    ];
  });
}
