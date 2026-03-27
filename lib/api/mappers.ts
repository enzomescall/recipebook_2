import type {
  CommentRow,
  MealComparisonRow,
  MealRow,
  NotificationRow,
  ProfileRow,
  RecipeIngredientRow,
  RecipeRow,
  RecipeStepRow
} from "@/types/database";
import type { Comment, Meal, MealComparison, Notification, Recipe, RecipeIngredient, RecipeStep, UserProfile } from "@/types/domain";

export function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    cuisine: row.cuisine,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    tags: row.tags,
    dietaryLabels: row.dietary_labels,
    ingredients: (row.recipe_ingredients ?? [])
      .map((ingredient) => toRecipeIngredient(ingredient))
      .sort((left, right) => left.orderIndex - right.orderIndex),
    steps: (row.recipe_steps ?? []).map((step) => toRecipeStep(step)).sort((left, right) => left.orderIndex - right.orderIndex),
    status: row.status,
    rankPosition: row.rank_position ?? 0,
    parentRecipeId: row.parent_recipe_id ?? null,
    versionNumber: row.version_number ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toRecipeIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    note: row.note,
    orderIndex: row.order_index
  };
}

export function toRecipeStep(row: RecipeStepRow): RecipeStep {
  return {
    id: row.id,
    orderIndex: row.order_index,
    instructionText: row.instruction_text,
    ingredientReferences: row.ingredient_references,
    imageUrl: row.image_url
  };
}

export function toMeal(row: MealRow): Meal {
  return {
    id: row.id,
    ownerId: row.owner_id,
    recipeId: row.recipe_id,
    title: row.title,
    caption: row.caption,
    heroImageUrl: row.hero_image_url,
    visibility: row.visibility,
    rankPosition: row.rank_position,
    rankingState: row.ranking_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toMealComparison(row: MealComparisonRow): MealComparison {
  return {
    id: row.id,
    userId: row.user_id,
    subjectMealId: row.subject_meal_id,
    comparedAgainstMealId: row.compared_against_meal_id,
    preferredMealId: row.preferred_meal_id,
    createdAt: row.created_at
  };
}

export function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    userId: row.user_id,
    mealId: row.meal_id,
    parentCommentId: row.parent_comment_id,
    body: row.body,
    mentionedUserIds: row.mentioned_user_ids,
    likeCount: row.like_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    type: row.type,
    targetId: row.target_id,
    secondaryTargetId: row.secondary_target_id,
    readAt: row.read_at,
    createdAt: row.created_at
  };
}
