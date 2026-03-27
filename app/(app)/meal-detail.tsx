import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Avatar, Button, Card, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { getMealById } from "../../lib/api/meals";
import { toggleMealLike, toggleStarredMeal, toggleFollowUser } from "../../lib/api/social";
import {
  createMealLikeNotification,
  createStarNotification,
  createFollowNotification
} from "../../lib/api/notifications";
import { useSessionStore } from "../../store/session";
import { formatRelativeTime } from "../../features/feed/format";

export default function MealDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const currentUser = useSessionStore((state) => state.user);

  const [liked, setLiked] = useState(false);
  const [starred, setStarred] = useState(false);
  const [following, setFollowing] = useState(false);

  const query = useQuery({
    queryKey: ["meal", mealId],
    queryFn: () => getMealById(mealId!),
    enabled: Boolean(mealId)
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      toggleMealLike({ userId: currentUser!.id, mealId: mealId! }),
    onMutate: () => {
      setLiked((prev) => !prev);
    },
    onSuccess: async (isNowLiked) => {
      if (isNowLiked && query.data) {
        await createMealLikeNotification({
          actorUserId: currentUser!.id,
          recipientUserId: query.data.meal.ownerId,
          mealId: mealId!
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["meal", mealId] });
    },
    onError: () => {
      setLiked((prev) => !prev);
    }
  });

  const starMutation = useMutation({
    mutationFn: () =>
      toggleStarredMeal({ userId: currentUser!.id, mealId: mealId! }),
    onMutate: () => {
      setStarred((prev) => !prev);
    },
    onSuccess: async (isNowStarred) => {
      if (isNowStarred && query.data) {
        await createStarNotification({
          actorUserId: currentUser!.id,
          recipientUserId: query.data.meal.ownerId,
          mealId: mealId!
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["meal", mealId] });
    },
    onError: () => {
      setStarred((prev) => !prev);
    }
  });

  const followMutation = useMutation({
    mutationFn: () =>
      toggleFollowUser({
        followerId: currentUser!.id,
        followingId: query.data!.meal.ownerId
      }),
    onMutate: () => {
      setFollowing((prev) => !prev);
    },
    onSuccess: async (isNowFollowing) => {
      if (isNowFollowing && query.data) {
        await createFollowNotification({
          actorUserId: currentUser!.id,
          recipientUserId: query.data.meal.ownerId
        });
      }
    },
    onError: () => {
      setFollowing((prev) => !prev);
    }
  });

  if (!mealId) {
    return (
      <Screen>
        <ErrorState title="Missing meal ID" description="No meal identifier was provided." />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState title="Loading meal" description="Fetching meal details." />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load meal"
          description={query.error instanceof Error ? query.error.message : "Something went wrong."}
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const { meal, owner, recipe } = query.data;
  const isOwner = currentUser?.id === meal.ownerId;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
        <Text style={styles.sectionLabel}>Meal</Text>
      </View>

      <Card>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{meal.title}</Text>
          <View style={styles.visibilityPill}>
            <Text style={styles.visibilityText}>{meal.visibility}</Text>
          </View>
        </View>

        {meal.caption ? (
          <Text style={styles.caption}>{meal.caption}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.rankPill}>
            <Text style={styles.rankText}>#{meal.rankPosition}</Text>
          </View>
          <Text style={styles.metaCopy}>{formatRelativeTime(meal.createdAt)}</Text>
        </View>
      </Card>

      {meal.heroImageUrl ? (
        <Card contentStyle={styles.imageCard}>
          <Image
            source={{ uri: meal.heroImageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Card>
      ) : null}

      <Card>
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, liked && styles.actionButtonActive]}
            onPress={() => currentUser && likeMutation.mutate()}
            disabled={!currentUser || likeMutation.isPending}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={16}
              color={liked ? theme.colors.accent : theme.colors.muted}
            />
            <Text style={[styles.actionLabel, liked && styles.actionLabelActive]}>
              {liked ? "Liked" : "Like"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, starred && styles.actionButtonActive]}
            onPress={() => currentUser && starMutation.mutate()}
            disabled={!currentUser || starMutation.isPending}
          >
            <Ionicons
              name={starred ? "bookmark" : "bookmark-outline"}
              size={16}
              color={starred ? theme.colors.accent : theme.colors.muted}
            />
            <Text style={[styles.actionLabel, starred && styles.actionLabelActive]}>
              {starred ? "Saved" : "Save"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push({ pathname: "/(app)/comments", params: { mealId: meal.id } })}
          >
            <Ionicons name="chatbubble-outline" size={16} color={theme.colors.muted} />
            <Text style={styles.actionLabel}>Comment</Text>
          </Pressable>

          {!isOwner ? (
            <Pressable
              style={[styles.actionButton, following && styles.actionButtonActive]}
              onPress={() => currentUser && followMutation.mutate()}
              disabled={!currentUser || followMutation.isPending}
            >
              <Ionicons
                name={following ? "person-check" : "person-add-outline"}
                size={16}
                color={following ? theme.colors.accent : theme.colors.muted}
              />
              <Text style={[styles.actionLabel, following && styles.actionLabelActive]}>
                {following ? "Following" : "Follow"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      {recipe ? (
        <Card
          interactive
          onPress={() => router.push({ pathname: "/(app)/recipe-detail", params: { recipeId: recipe.id } })}
        >
          <View style={styles.recipeRow}>
            <View style={styles.recipeCopy}>
              <Text style={styles.recipeLabel}>Recipe</Text>
              <Text style={styles.recipeName}>{recipe.title}</Text>
              {recipe.cuisine ? <Text style={styles.recipeSubtext}>{recipe.cuisine}</Text> : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <Pressable
          style={styles.ownerRow}
          onPress={() => router.push({ pathname: "/(app)/profile" })}
        >
          <Avatar
            name={owner.displayName}
            source={owner.profileImageUrl ? { uri: owner.profileImageUrl } : undefined}
            size={48}
          />
          <View style={styles.ownerCopy}>
            <Text style={styles.ownerName}>{owner.displayName}</Text>
            <Text style={styles.ownerHandle}>@{owner.username}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Card>

      {isOwner ? (
        <Card>
          <View style={styles.ownerSection}>
            <Text style={styles.ownerSectionTitle}>Owner actions</Text>
            <Button
              label="Edit meal"
              variant="secondary"
              fullWidth
              onPress={() => router.push({ pathname: "/(app)/edit-meal", params: { mealId: meal.id } })}
            />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xl * 1.2
  },
  backButton: {
    alignSelf: "flex-start"
  },
  backLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 15
  },
  sectionLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between"
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.serifBold,
    fontSize: 26,
    lineHeight: 32
  },
  visibilityPill: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  visibilityText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sansBold,
    fontSize: 11,
    textTransform: "capitalize"
  },
  caption: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  rankPill: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  rankText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 13
  },
  metaCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  imageCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: theme.radius.lg
  },
  heroImage: {
    borderRadius: theme.radius.lg,
    height: 220,
    width: "100%"
  },
  actionsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap"
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: theme.spacing.xxs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  actionButtonActive: {
    backgroundColor: theme.colors.accentSoft
  },
  actionLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sansBold,
    fontSize: 13
  },
  actionLabelActive: {
    color: theme.colors.accent
  },
  recipeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  recipeCopy: {
    flex: 1,
    gap: 2
  },
  recipeLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  recipeName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 17
  },
  recipeSubtext: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  chevron: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 22,
    fontWeight: "300"
  },
  ownerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  ownerCopy: {
    flex: 1,
    gap: 2
  },
  ownerName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.sansBold,
    fontSize: 15
  },
  ownerHandle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  ownerSection: {
    gap: theme.spacing.sm
  },
  ownerSectionTitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  }
});
