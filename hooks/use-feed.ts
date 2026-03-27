import { useQuery } from "@tanstack/react-query";

import { getFeedItems } from "@/lib/api/feed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";
import type { FeedItem as ApiFeedItem } from "@/lib/api/feed";
import type { FeedItem } from "@/features/feed/types";
import type { Meal, Recipe, UserProfile } from "@/types/domain";

function mapApiItemToDomainItem(item: ApiFeedItem): FeedItem {
  const meal: Meal = {
    id: item.mealId,
    ownerId: item.ownerId,
    recipeId: item.recipeId,
    title: item.mealTitle,
    caption: item.mealCaption,
    heroImageUrl: item.mealHeroImageUrl,
    visibility: item.mealVisibility,
    rankPosition: item.mealRankPosition ?? 0,
    rankingState: null,
    createdAt: item.mealCreatedAt,
    updatedAt: item.mealCreatedAt
  };

  const owner: UserProfile = {
    id: item.ownerId,
    username: item.ownerUsername,
    displayName: item.ownerDisplayName,
    bio: null,
    profileImageUrl: item.ownerProfileImageUrl,
    followersCount: 0,
    followingCount: 0,
    createdAt: item.mealCreatedAt,
    updatedAt: item.mealCreatedAt
  };

  const recipe: Recipe | null = {
    id: item.recipeId,
    ownerId: item.ownerId,
    title: item.recipeTitle,
    description: null,
    coverImageUrl: item.recipeCoverImageUrl,
    cuisine: item.recipeCuisine,
    servings: null,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    tags: [],
    dietaryLabels: [],
    ingredients: [],
    steps: [],
    status: "published",
    rankPosition: 0,
    parentRecipeId: null,
    versionNumber: 1,
    createdAt: item.mealCreatedAt,
    updatedAt: item.mealCreatedAt
  };

  return { meal, owner, recipe };
}

async function fetchFeedItems(): Promise<FeedItem[]> {
  const items = await getFeedItems({ limit: 20 });
  return items.map(mapApiItemToDomainItem);
}

export function useFeed() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: ["feed", user?.id],
    queryFn: fetchFeedItems,
    enabled: isSupabaseConfigured && status === "authenticated" && Boolean(user?.id),
    staleTime: 20_000
  });
}
