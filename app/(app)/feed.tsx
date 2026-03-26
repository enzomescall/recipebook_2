import { useState } from "react";
import { GestureResponderEvent, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import { Avatar, Button, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
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
        <Text style={styles.sectionLabel}>Feed</Text>
        <Text style={styles.title}>A calm place for meals people actually want to share.</Text>
        <Text style={styles.subtitle}>
          {isSupabaseConfigured
            ? "Live posts from the meals you can access."
            : "Connect Supabase to turn this screen into a live feed."}
        </Text>
      </View>

      {feed.isError ? (
        <ErrorState
          title="Could not load the feed"
          description={feed.error instanceof Error ? feed.error.message : "Try refreshing the feed."}
          actionLabel="Retry"
          onAction={() => void feed.refetch()}
        />
      ) : null}

      {!isSupabaseConfigured ? (
        <EmptyState
          title="Connect your backend"
          description="Add the Supabase env vars to load the live meal feed."
          actionLabel="Refresh"
          onAction={() => void feed.refetch()}
        />
      ) : isLoading ? (
        <LoadingState title="Loading feed" description="Pulling in the latest meals you can see." />
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
                <View style={styles.postHeader}>
                  <Avatar name={item.owner.displayName} size={44} />
                  <View style={styles.postMeta}>
                    <Text style={styles.postName}>{item.owner.displayName}</Text>
                    <Text style={styles.postHandle}>@{item.owner.username}</Text>
                  </View>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>#{item.meal.rankPosition || 1}</Text>
                  </View>
                </View>

                <View style={styles.postHero}>
                  <Text style={styles.postTitle}>{item.meal.title}</Text>
                  {item.recipe ? <Text style={styles.postRecipe}>{item.recipe.title}</Text> : null}
                  <Text style={styles.postCaption}>{item.meal.caption ?? "No caption added yet."}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaChip}>{item.meal.visibility}</Text>
                  <Text style={styles.metaCopy}>{formatRelativeTime(item.meal.createdAt)}</Text>
                  {item.recipe?.cuisine ? <Text style={styles.metaCopy}>{item.recipe.cuisine}</Text> : null}
                </View>

                <View style={styles.socialRow}>
                  <Button
                    label={isLiked ? "♥ Liked" : "♥ Like"}
                    variant="ghost"
                    size="sm"
                    disabled={!currentUser || likeMutation.isPending}
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      if (currentUser) {
                        likeMutation.mutate({ mealId: item.meal.id, ownerId: item.meal.ownerId });
                      }
                    }}
                    style={isLiked ? styles.socialBtnActive : undefined}
                  />
                  <Button
                    label="💬 Comment"
                    variant="ghost"
                    size="sm"
                    onPress={(e: GestureResponderEvent) => {
                      e.stopPropagation();
                      router.push({ pathname: "/(app)/comments", params: { mealId: item.meal.id } });
                    }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="No meals yet"
          description="Once you start creating and sharing meals, they will appear here in chronological order."
          actionLabel="Refresh"
          onAction={() => void feed.refetch()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl * 1.2
  },
  sectionLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    maxWidth: 320
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 360
  },
  list: {
    gap: theme.spacing.md
  },
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  postMeta: {
    flex: 1,
    gap: 2
  },
  postName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    fontWeight: "700"
  },
  postHandle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
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
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "800"
  },
  postHero: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  postTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 20,
    fontWeight: "700"
  },
  postRecipe: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "700"
  },
  postCaption: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  metaChip: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  metaCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  socialRow: {
    borderTopColor: theme.colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs
  },
  socialBtnActive: {
    backgroundColor: theme.colors.accentSoft
  }
});
