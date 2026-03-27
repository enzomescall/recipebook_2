import { useState } from "react";
import { GestureResponderEvent, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Avatar, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useFeed } from "../../hooks/use-feed";
import { formatRelativeTime } from "../../features/feed/format";
import { toggleMealLike } from "../../lib/api/social";
import { createMealLikeNotification } from "../../lib/api/notifications";
import { useSessionStore } from "../../store/session";

export default function FeedScreen() {
  const router = useRouter();
  const feed = useFeed();
  const currentUser = useSessionStore((state) => state.user);
  const isLoading = feed.isLoading && !feed.data;
  const [likedMeals, setLikedMeals] = useState<Record<string, boolean>>({});

  const likeMutation = useMutation({
    mutationFn: ({ mealId, ownerId }: { mealId: string; ownerId: string }) =>
      toggleMealLike({ userId: currentUser!.id, mealId }),
    onMutate: ({ mealId }) => {
      setLikedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    },
    onSuccess: async (isNowLiked, { mealId, ownerId }) => {
      if (isNowLiked && currentUser) {
        await createMealLikeNotification({
          actorUserId: currentUser.id,
          recipientUserId: ownerId,
          mealId
        });
      }
    },
    onError: (_err, { mealId }) => {
      setLikedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    }
  });

  return (
    <Screen
      scrollProps={{
        refreshControl: <RefreshControl refreshing={feed.isFetching && !feed.isLoading} onRefresh={() => void feed.refetch()} />
      }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Feed</Text>
        <Text style={styles.subtitle}>
          {isSupabaseConfigured ? "Meals from people you follow" : "Connect Supabase to load your feed"}
        </Text>
      </View>

      {feed.isError ? (
        <ErrorState
          title="Could not load the feed"
          description={feed.error instanceof Error ? feed.error.message : "Try refreshing."}
          actionLabel="Retry"
          onAction={() => void feed.refetch()}
        />
      ) : null}

      {!isSupabaseConfigured ? (
        <EmptyState
          title="No backend connected"
          description="Add the Supabase env vars to load the live meal feed."
          actionLabel="Refresh"
          onAction={() => void feed.refetch()}
        />
      ) : isLoading ? (
        <LoadingState title="Loading your feed" description="Pulling in the latest meals." />
      ) : feed.data?.length ? (
        <View style={styles.list}>
          {feed.data.map((item) => {
            const isLiked = likedMeals[item.meal.id] ?? false;

            return (
              <Card
                key={item.meal.id}
                interactive
                onPress={() => router.push({ pathname: "/(app)/meal-detail", params: { mealId: item.meal.id } })}
              >
                {/* Author row */}
                <View style={styles.authorRow}>
                  <Avatar name={item.owner.displayName} uri={item.owner.profileImageUrl} size={40} />
                  <View style={styles.authorMeta}>
                    <Text style={styles.authorName}>{item.owner.displayName}</Text>
                    <Text style={styles.authorHandle}>@{item.owner.username}</Text>
                  </View>
                </View>

                {/* Meal content */}
                <View style={styles.mealBody}>
                  <View style={styles.mealTitleRow}>
                    <Text style={[styles.mealTitle, { flex: 1 }]}>{item.meal.title}</Text>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankLabel}>#{item.meal.rankPosition || 1}</Text>
                    </View>
                  </View>
                  {item.recipe ? (
                    <View style={styles.recipeTag}>
                      <Ionicons name="book-outline" size={12} color={theme.colors.accent} />
                      <Text style={styles.recipeTagText}>{item.recipe.title}</Text>
                    </View>
                  ) : null}
                  {item.meal.caption ? (
                    <Text style={styles.caption}>{item.meal.caption}</Text>
                  ) : null}
                </View>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaTime}>{formatRelativeTime(item.meal.createdAt)}</Text>
                  {item.recipe?.cuisine ? (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>{item.recipe.cuisine}</Text>
                    </>
                  ) : null}
                  {item.meal.visibility !== "public" ? (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Ionicons
                        name={item.meal.visibility === "followers" ? "people-outline" : "lock-closed-outline"}
                        size={12}
                        color={theme.colors.muted}
                      />
                    </>
                  ) : null}
                </View>

                {/* Social row */}
                <View style={styles.socialRow}>
                  <Pressable
                    style={[styles.socialBtn, isLiked && styles.socialBtnActive]}
                    disabled={!currentUser || likeMutation.isPending}
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      if (currentUser) {
                        likeMutation.mutate({ mealId: item.meal.id, ownerId: item.meal.ownerId });
                      }
                    }}
                  >
                    <Ionicons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={18}
                      color={isLiked ? theme.colors.accent : theme.colors.muted}
                    />
                    <Text style={[styles.socialLabel, isLiked && styles.socialLabelActive]}>
                      {isLiked ? "Liked" : "Like"}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.socialBtn}
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      router.push({ pathname: "/(app)/comments", params: { mealId: item.meal.id } });
                    }}
                  >
                    <Ionicons name="chatbubble-outline" size={17} color={theme.colors.muted} />
                    <Text style={styles.socialLabel}>Comment</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="Nothing here yet"
          description="Follow people and create meals — they'll show up here."
          actionLabel="Refresh"
          onAction={() => void feed.refetch()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xl
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14
  },
  list: {
    gap: theme.spacing.md
  },

  // Author
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  authorMeta: {
    flex: 1,
    gap: 1
  },
  authorName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  },
  authorHandle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4
  },
  rankLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800"
  },

  // Meal
  mealBody: {
    gap: theme.spacing.xs
  },
  mealTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  mealTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26
  },
  recipeTag: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  recipeTagText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700"
  },
  caption: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },

  // Meta
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  metaTime: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  metaDot: {
    color: theme.colors.muted,
    fontSize: 12
  },
  metaText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },

  // Social
  socialRow: {
    borderTopColor: theme.colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm
  },
  socialBtn: {
    alignItems: "center",
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  socialBtnActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentSoft
  },
  socialLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "600"
  },
  socialLabelActive: {
    color: theme.colors.accent
  }
});
