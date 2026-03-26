export const ENV_KEYS = {
  supabaseUrl: "EXPO_PUBLIC_SUPABASE_URL",
  supabaseAnonKey: "EXPO_PUBLIC_SUPABASE_ANON_KEY"
} as const;

export const VISIBILITY_VALUES = ["public", "followers", "private"] as const;
export const RECIPE_STATUS_VALUES = ["draft", "published"] as const;
export const COMMENT_NOTIFICATION_TYPES = [
  "follow",
  "meal_like",
  "meal_comment",
  "comment_reply",
  "comment_like",
  "mention",
  "meal_star"
] as const;
