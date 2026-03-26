import { mapSupabaseError } from "@/lib/api/shared";
import { toComment } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { CommentRow } from "@/types/database";
import type { Comment } from "@/types/domain";

export async function listMealComments(mealId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("meal_id", mealId)
    .order("created_at", { ascending: true });

  mapSupabaseError(error, "Failed to load comments.");
  return (data ?? []).map((row) => toComment(row as CommentRow));
}

export async function createComment(comment: Pick<Comment, "userId" | "mealId" | "parentCommentId" | "body" | "mentionedUserIds">) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("comments").insert({
    user_id: comment.userId,
    meal_id: comment.mealId,
    parent_comment_id: comment.parentCommentId,
    body: comment.body,
    mentioned_user_ids: comment.mentionedUserIds
  }).select("*").single<CommentRow>();

  mapSupabaseError(error, "Failed to create comment.");
  if (!data) {
    throw new Error("Failed to create comment.");
  }
  return toComment(data);
}
