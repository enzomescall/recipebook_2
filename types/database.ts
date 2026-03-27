export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  order_index: number;
  name: string;
  quantity: string | null;
  unit: string | null;
  note: string | null;
  created_at: string;
};

export type RecipeStepRow = {
  id: string;
  recipe_id: string;
  order_index: number;
  instruction_text: string;
  ingredient_references: string[];
  image_url: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  profile_image_url: string | null;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string;
};

export type RecipeRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cuisine: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
  dietary_labels: string[];
  status: "draft" | "published";
  rank_position: number;
  parent_recipe_id: string | null;
  version_number: number;
  created_at: string;
  updated_at: string;
  recipe_ingredients?: RecipeIngredientRow[];
  recipe_steps?: RecipeStepRow[];
};

export type RecipeComparisonRow = {
  id: string;
  user_id: string;
  subject_recipe_id: string;
  compared_against_recipe_id: string;
  preferred_recipe_id: string;
  created_at: string;
};

export type MealRow = {
  id: string;
  owner_id: string;
  recipe_id: string;
  title: string;
  caption: string | null;
  hero_image_url: string | null;
  visibility: "public" | "followers" | "private";
  rank_position: number;
  ranking_state: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type MealComparisonRow = {
  id: string;
  user_id: string;
  subject_meal_id: string;
  compared_against_meal_id: string;
  preferred_meal_id: string;
  created_at: string;
};

export type CommentRow = {
  id: string;
  user_id: string;
  meal_id: string;
  parent_comment_id: string | null;
  body: string;
  mentioned_user_ids: string[];
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  type: "follow" | "meal_like" | "meal_comment" | "comment_reply" | "comment_like" | "mention" | "meal_star";
  target_id: string;
  secondary_target_id: string | null;
  read_at: string | null;
  created_at: string;
};
