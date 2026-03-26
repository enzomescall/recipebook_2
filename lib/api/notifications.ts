import { mapSupabaseError } from "@/lib/api/shared";
import { toNotification } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@/types/database";
import type { Notification } from "@/types/domain";

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

export async function createFollowNotification(params: {
  actorUserId: string;
  recipientUserId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "follow",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.actorUserId
  });
  mapSupabaseError(error, "Failed to create follow notification.");
}

export async function createMealLikeNotification(params: {
  actorUserId: string;
  recipientUserId: string;
  mealId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "meal_like",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.mealId
  });
  mapSupabaseError(error, "Failed to create meal like notification.");
}

export async function createCommentNotification(params: {
  actorUserId: string;
  recipientUserId: string;
  mealId: string;
  commentId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "meal_comment",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.mealId,
    secondary_target_id: params.commentId
  });
  mapSupabaseError(error, "Failed to create comment notification.");
}

export async function createCommentReplyNotification(params: {
  actorUserId: string;
  recipientUserId: string;
  mealId: string;
  commentId: string;
  parentCommentId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "comment_reply",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.commentId,
    secondary_target_id: params.parentCommentId
  });
  mapSupabaseError(error, "Failed to create comment reply notification.");
}

export async function createCommentLikeNotification(params: {
  actorUserId: string;
  recipientUserId: string;
  commentId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "comment_like",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.commentId
  });
  mapSupabaseError(error, "Failed to create comment like notification.");
}

export async function createStarNotification(params: {
  actorUserId: string;
  recipientUserId: string;
  mealId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    type: "meal_star",
    actor_user_id: params.actorUserId,
    recipient_user_id: params.recipientUserId,
    target_id: params.mealId
  });
  mapSupabaseError(error, "Failed to create star notification.");
}

// ---------------------------------------------------------------------------
// Richer read shape
// ---------------------------------------------------------------------------

export interface RichNotification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorProfileImageUrl: string | null;
  targetId: string | null;
  secondaryTargetId: string | null;
}

type NotificationJoinRow = {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  actor_user_id: string | null;
  target_id: string | null;
  secondary_target_id: string | null;
  profiles: {
    username: string;
    display_name: string;
    profile_image_url: string | null;
  } | null;
};

export async function getNotificationsForUser(userId: string): Promise<RichNotification[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id,
       type,
       read_at,
       created_at,
       actor_user_id,
       target_id,
       secondary_target_id,
       profiles!actor_user_id ( username, display_name, profile_image_url )`
    )
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false });

  mapSupabaseError(error, "Failed to load notifications.");

  return (data ?? []).map((row) => {
    const r = row as unknown as NotificationJoinRow;
    return {
      id: r.id,
      type: r.type,
      read: r.read_at !== null,
      createdAt: r.created_at,
      actorId: r.actor_user_id,
      actorUsername: r.profiles?.username ?? null,
      actorDisplayName: r.profiles?.display_name ?? null,
      actorProfileImageUrl: r.profiles?.profile_image_url ?? null,
      targetId: r.target_id,
      secondaryTargetId: r.secondary_target_id
    } satisfies RichNotification;
  });
}

export async function listNotifications(recipientUserId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", recipientUserId)
    .order("created_at", { ascending: false });

  mapSupabaseError(error, "Failed to load notifications.");
  return (data ?? []).map((row) => toNotification(row as NotificationRow));
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select("*")
    .single<NotificationRow>();

  mapSupabaseError(error, "Failed to update notification.");
  if (!data) {
    throw new Error("Failed to update notification.");
  }
  return toNotification(data);
}
