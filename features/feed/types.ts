import type { Meal, Recipe, UserProfile } from "@/types/domain";

export type FeedItem = {
  meal: Meal;
  owner: UserProfile;
  recipe: Recipe | null;
};

export type FeedQueryResult = {
  items: FeedItem[];
};
