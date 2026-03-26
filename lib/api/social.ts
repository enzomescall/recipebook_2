import { getSupabaseClient } from "@/lib/supabase/client";
import { mapSupabaseError } from "@/lib/api/shared";

// Toggle follow: follow if not following, unfollow if already following.
// Returns the new following state (true = now following).
export async function toggleFollowUser(params: {
  followerId: string;
  followingId: string;
}): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", params.followerId)
    .eq("following_id", params.followingId)
    .maybeSingle();

  mapSupabaseError(selectError, "Failed to check follow status.");

  if (existing) {
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", params.followerId)
      .eq("following_id", params.followingId);

    mapSupabaseError(deleteError, "Failed to unfollow user.");
    return false;
  }

  const { error: insertError } = await supabase.from("follows").insert({
    follower_id: params.followerId,
    following_id: params.followingId
  });

  mapSupabaseError(insertError, "Failed to follow user.");
  return true;
}

// Toggle meal like for the current user.
// Returns new liked state (true = now liked).
export async function toggleMealLike(params: {
  userId: string;
  mealId: string;
}): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("post_likes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("meal_id", params.mealId)
    .maybeSingle();

  mapSupabaseError(selectError, "Failed to check meal like status.");

  if (existing) {
    const { error: deleteError } = await supabase
      .from("post_likes")
      .delete()
      .eq("user_id", params.userId)
      .eq("meal_id", params.mealId);

    mapSupabaseError(deleteError, "Failed to unlike meal.");
    return false;
  }

  const { error: insertError } = await supabase.from("post_likes").insert({
    user_id: params.userId,
    meal_id: params.mealId
  });

  mapSupabaseError(insertError, "Failed to like meal.");
  return true;
}

// Toggle starred meal for the current user.
// Returns new starred state (true = now starred).
export async function toggleStarredMeal(params: {
  userId: string;
  mealId: string;
}): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("starred_meals")
    .select("id")
    .eq("user_id", params.userId)
    .eq("meal_id", params.mealId)
    .maybeSingle();

  mapSupabaseError(selectError, "Failed to check starred meal status.");

  if (existing) {
    const { error: deleteError } = await supabase
      .from("starred_meals")
      .delete()
      .eq("user_id", params.userId)
      .eq("meal_id", params.mealId);

    mapSupabaseError(deleteError, "Failed to unstar meal.");
    return false;
  }

  const { error: insertError } = await supabase.from("starred_meals").insert({
    user_id: params.userId,
    meal_id: params.mealId
  });

  mapSupabaseError(insertError, "Failed to star meal.");
  return true;
}

// Toggle comment like for the current user.
// Returns new liked state (true = now liked).
export async function toggleCommentLike(params: {
  userId: string;
  commentId: string;
}): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("comment_id", params.commentId)
    .maybeSingle();

  mapSupabaseError(selectError, "Failed to check comment like status.");

  if (existing) {
    const { error: deleteError } = await supabase
      .from("comment_likes")
      .delete()
      .eq("user_id", params.userId)
      .eq("comment_id", params.commentId);

    mapSupabaseError(deleteError, "Failed to unlike comment.");
    return false;
  }

  const { error: insertError } = await supabase.from("comment_likes").insert({
    user_id: params.userId,
    comment_id: params.commentId
  });

  mapSupabaseError(insertError, "Failed to like comment.");
  return true;
}
