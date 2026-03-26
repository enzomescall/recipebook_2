import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { Avatar, Button, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { listMealComments, createComment } from "../../lib/api/comments";
import { toggleCommentLike } from "../../lib/api/social";
import { createCommentLikeNotification } from "../../lib/api/notifications";
import { useSessionStore } from "../../store/session";
import { formatRelativeTime } from "../../features/feed/format";
import type { Comment } from "../../types/domain";

export default function CommentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const currentUser = useSessionStore((state) => state.user);

  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<TextInput>(null);

  const commentsQuery = useQuery({
    queryKey: ["comments", mealId],
    queryFn: () => listMealComments(mealId!),
    enabled: Boolean(mealId)
  });

  const postMutation = useMutation({
    mutationFn: () =>
      createComment({
        userId: currentUser!.id,
        mealId: mealId!,
        parentCommentId: replyTo?.id ?? null,
        body: body.trim(),
        mentionedUserIds: []
      }),
    onSuccess: () => {
      setBody("");
      setReplyTo(null);
      void queryClient.invalidateQueries({ queryKey: ["comments", mealId] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: (comment: Comment) =>
      toggleCommentLike({ userId: currentUser!.id, commentId: comment.id }),
    onMutate: (comment) => {
      setLikedComments((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }));
    },
    onSuccess: async (isNowLiked, comment) => {
      if (isNowLiked) {
        await createCommentLikeNotification({
          actorUserId: currentUser!.id,
          recipientUserId: comment.userId,
          commentId: comment.id
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["comments", mealId] });
    },
    onError: (_err, comment) => {
      setLikedComments((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }));
    }
  });

  function handleReply(comment: Comment) {
    setReplyTo(comment);
    inputRef.current?.focus();
  }

  function handleCancelReply() {
    setReplyTo(null);
    setBody("");
  }

  if (!mealId) {
    return (
      <Screen>
        <ErrorState title="Missing meal ID" description="No meal identifier was provided." />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <Screen scrollProps={{}}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>
          <Text style={styles.sectionLabel}>Comments</Text>
        </View>

        {commentsQuery.isLoading ? (
          <LoadingState title="Loading comments" description="Fetching the conversation." />
        ) : commentsQuery.isError ? (
          <ErrorState
            title="Could not load comments"
            description={
              commentsQuery.error instanceof Error
                ? commentsQuery.error.message
                : "Something went wrong."
            }
            actionLabel="Retry"
            onAction={() => void commentsQuery.refetch()}
          />
        ) : !commentsQuery.data?.length ? (
          <EmptyState
            title="No comments yet"
            description="Be the first to leave a comment on this meal."
          />
        ) : (
          <View style={styles.list}>
            {commentsQuery.data.map((comment) => {
              const isLiked = likedComments[comment.id] ?? false;
              const isHighlighted = replyTo?.id === comment.id;

              return (
                <Card
                  key={comment.id}
                  style={isHighlighted ? styles.highlightedCard : undefined}
                >
                  <View style={styles.commentHeader}>
                    <Avatar name={comment.userId} size={36} />
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUser}>{comment.userId}</Text>
                      <Text style={styles.commentTime}>
                        {formatRelativeTime(comment.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {comment.parentCommentId ? (
                    <View style={styles.replyBadge}>
                      <Text style={styles.replyBadgeText}>Reply</Text>
                    </View>
                  ) : null}

                  <Text style={styles.commentBody}>{comment.body}</Text>

                  <View style={styles.commentActions}>
                    <Pressable
                      style={[styles.commentActionBtn, isLiked && styles.commentActionBtnActive]}
                      onPress={() => currentUser && likeMutation.mutate(comment)}
                      disabled={!currentUser || likeMutation.isPending}
                    >
                      <Text style={[styles.commentActionIcon, isLiked && styles.commentActionIconActive]}>
                        ♥
                      </Text>
                      <Text style={[styles.commentActionLabel, isLiked && styles.commentActionLabelActive]}>
                        {comment.likeCount + (isLiked ? 1 : 0)}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.commentActionBtn}
                      onPress={() => handleReply(comment)}
                    >
                      <Text style={styles.commentActionLabel}>Reply</Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <View style={styles.inputSection}>
          {replyTo ? (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                Replying to a comment
              </Text>
              <Pressable onPress={handleCancelReply}>
                <Text style={styles.cancelReply}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={body}
              onChangeText={setBody}
              placeholder="Add a comment..."
              placeholderTextColor={theme.colors.muted}
              multiline
              maxLength={500}
            />
            <Button
              label="Post"
              variant="primary"
              size="sm"
              loading={postMutation.isPending}
              disabled={!body.trim() || !currentUser || postMutation.isPending}
              onPress={() => postMutation.mutate()}
            />
          </View>

          {postMutation.isError ? (
            <Text style={styles.postError}>
              {postMutation.error instanceof Error
                ? postMutation.error.message
                : "Failed to post comment."}
            </Text>
          ) : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  header: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xl * 1.2
  },
  backButton: {
    alignSelf: "flex-start"
  },
  backLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    fontWeight: "700"
  },
  sectionLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  list: {
    gap: theme.spacing.md
  },
  highlightedCard: {
    borderColor: theme.colors.accent
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  commentMeta: {
    flex: 1,
    gap: 2
  },
  commentUser: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  },
  commentTime: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  replyBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  replyBadgeText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    fontWeight: "700"
  },
  commentBody: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  commentActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  commentActionBtn: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  commentActionBtnActive: {
    backgroundColor: theme.colors.accentSoft
  },
  commentActionIcon: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  commentActionIconActive: {
    color: theme.colors.accent
  },
  commentActionLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700"
  },
  commentActionLabelActive: {
    color: theme.colors.accent
  },
  inputSection: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl
  },
  replyIndicator: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  replyIndicatorText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "700"
  },
  cancelReply: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline"
  },
  inputRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  postError: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 13
  }
});
