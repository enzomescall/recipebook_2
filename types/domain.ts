export type Visibility = "public" | "followers" | "private";
export type RecipeStatus = "draft" | "published";
export type NotificationType =
  | "follow"
  | "meal_like"
  | "meal_comment"
  | "comment_reply"
  | "comment_like"
  | "mention"
  | "meal_star";

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  note: string | null;
  orderIndex: number;
};

export type RecipeStep = {
  id: string;
  orderIndex: number;
  instructionText: string;
  ingredientReferences: string[];
  imageUrl: string | null;
};

export type Recipe = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  cuisine: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  tags: string[];
  dietaryLabels: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  status: RecipeStatus;
  rankPosition: number;
  parentRecipeId: string | null;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
};

export type RecipeWithStats = Recipe & {
  mealCount: number;
  lastCookedAt: string | null;
};

export type RecipeComparison = {
  id: string;
  userId: string;
  subjectRecipeId: string;
  comparedAgainstRecipeId: string;
  preferredRecipeId: string;
  createdAt: string;
};

export type Meal = {
  id: string;
  ownerId: string;
  recipeId: string;
  title: string;
  caption: string | null;
  heroImageUrl: string | null;
  visibility: Visibility;
  rankPosition: number;
  rankingState: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type MealComparison = {
  id: string;
  userId: string;
  subjectMealId: string;
  comparedAgainstMealId: string;
  preferredMealId: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  userId: string;
  mealId: string;
  parentCommentId: string | null;
  body: string;
  mentionedUserIds: string[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Follow = {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  targetId: string;
  secondaryTargetId: string | null;
  readAt: string | null;
  createdAt: string;
};
