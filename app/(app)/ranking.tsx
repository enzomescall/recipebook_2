import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { listMeals, updateMealRankOrder } from "../../lib/api/meals";
import { recordMealComparison } from "../../lib/api/ranking";
import { createRankingSession, nextComparison, resolveComparison, type RankingSession } from "../../lib/ranking/insertion";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function RankingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectMealId?: string; mode?: "create" | "rerank" }>();
  const paramSubjectMealId = typeof params.subjectMealId === "string" && params.subjectMealId ? params.subjectMealId : null;
  const mode = params.mode === "create" ? "create" : "rerank";

  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const userId = user?.id ?? null;
  const [subjectMealId, setSubjectMealId] = useState<string | null>(paramSubjectMealId);
  const [paramApplied, setParamApplied] = useState(false);
  const [session, setSession] = useState<RankingSession | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mealsQuery = useQuery({
    queryKey: ["meals", userId],
    queryFn: () => listMeals(userId!),
    enabled: isSupabaseConfigured && Boolean(userId)
  });

  const comparisonMutation = useMutation({
    mutationFn: recordMealComparison
  });

  const rankMutation = useMutation({
    mutationFn: ({ ownerId, orderedMealIds }: { ownerId: string; orderedMealIds: string[] }) =>
      updateMealRankOrder(ownerId, orderedMealIds),
    onSuccess: async () => {
      setMessage("Saved the updated meal order.");
      await queryClient.invalidateQueries({ queryKey: ["meals", userId] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to save the new ranking.");
    }
  });

  const meals = mealsQuery.data ?? [];

  // If a subjectMealId was passed via navigation params, apply it once meals are loaded
  useEffect(() => {
    if (paramSubjectMealId && !paramApplied && meals.length > 0) {
      const found = meals.some((meal) => meal.id === paramSubjectMealId);
      if (found) {
        setSubjectMealId(paramSubjectMealId);
      }
      setParamApplied(true);
      return;
    }

    // Fallback: auto-select first meal only when no param was supplied
    if (!paramSubjectMealId && !subjectMealId && meals.length > 0) {
      setSubjectMealId(meals[0]?.id ?? null);
    }
  }, [paramSubjectMealId, paramApplied, subjectMealId, meals]);

  const subjectMeal = meals.find((meal) => meal.id === subjectMealId) ?? null;
  const comparisonItems = useMemo(
    () => meals.filter((meal) => meal.id !== subjectMealId).map((meal) => ({ id: meal.id, rankPosition: meal.rankPosition })),
    [meals, subjectMealId]
  );

  useEffect(() => {
    if (!subjectMealId) {
      setSession(null);
      return;
    }

    setSession(createRankingSession(subjectMealId, comparisonItems));
    setMessage(null);
  }, [subjectMealId, comparisonItems]);

  const currentComparison = session ? nextComparison(session, comparisonItems) : null;
  const proposedOrder = session && subjectMeal
    ? buildProposedOrder(meals, subjectMeal.id, session.low)
    : [];

  async function choosePreferred(preferredId: string, comparedAgainstId: string) {
    if (!session || !subjectMealId || !userId) {
      return;
    }

    const nextSessionState = resolveComparison(session, comparisonItems, preferredId, comparedAgainstId);
    setSession(nextSessionState);

    await comparisonMutation.mutateAsync({
      userId,
      subjectMealId,
      comparedAgainstMealId: comparedAgainstId,
      preferredMealId: preferredId
    });
  }

  async function saveRankOrder() {
    if (!userId || proposedOrder.length === 0) {
      return;
    }

    await rankMutation.mutateAsync({
      ownerId: userId,
      orderedMealIds: proposedOrder.map((meal) => meal.id)
    });
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Ranking</Text>
          <Text style={styles.title}>Pairwise ranking will light up once Supabase is configured.</Text>
        </View>
        <EmptyState
          title="Connect your backend"
          description="This flow records meal comparisons and persists rank order."
        />
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Ranking</Text>
          <Text style={styles.title}>Sign in before you start reranking meals.</Text>
        </View>
        <EmptyState
          title="No active session"
          description="Ranking is tied to the authenticated owner’s meal library."
        />
      </Screen>
    );
  }

  if (mealsQuery.isLoading) {
    return (
      <Screen>
        <LoadingState
          title="Loading ranked meals"
          description="Pulling your current order before we open the comparison flow."
        />
      </Screen>
    );
  }

  if (mealsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          title="Couldn’t load meals"
          description="There was a problem loading the library for ranking."
          onAction={() => mealsQuery.refetch()}
        />
      </Screen>
    );
  }

  if (meals.length < 2) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Ranking</Text>
          <Text style={styles.title}>You need at least two meals before pairwise ranking gets interesting.</Text>
        </View>
        <EmptyState
          title="Not enough meals yet"
          description="Create a couple of meals first, then come back to compare and reorder them."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>Ranking</Text>
          <Button
            label="Cancel"
            size="sm"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
        <Text style={styles.title}>
          {mode === "create"
            ? "Where does your new meal rank? Compare it against the existing library."
            : "Compare one meal against the current library and lock in a new order."}
        </Text>
      </View>

      {!paramSubjectMealId && (
        <Card>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Choose the meal to rerank</Text>
            <View style={styles.selectorList}>
              {meals.map((meal) => (
                <Button
                  key={meal.id}
                  label={`#${meal.rankPosition} ${meal.title}`}
                  size="sm"
                  variant={meal.id === subjectMealId ? "primary" : "secondary"}
                  onPress={() => setSubjectMealId(meal.id)}
                />
              ))}
            </View>
          </View>
        </Card>
      )}

      {currentComparison && subjectMeal ? (
        <Card>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Current comparison</Text>
            <Text style={styles.helper}>Choose which meal belongs higher in your ranked list.</Text>

            <View style={styles.compareGrid}>
              <View style={styles.compareCard}>
                <Text style={styles.compareLabel}>Meal being ranked</Text>
                <Text style={styles.compareTitle}>{subjectMeal.title}</Text>
                <Text style={styles.compareCopy}>{subjectMeal.caption ?? "No caption yet."}</Text>
                <Button
                  label="Prefer this meal"
                  onPress={() => choosePreferred(subjectMeal.id, currentComparison.rightId)}
                  loading={comparisonMutation.isPending}
                />
              </View>

              <View style={styles.compareCard}>
                <Text style={styles.compareLabel}>Current rank #{currentComparison.pivotIndex + 1}</Text>
                <Text style={styles.compareTitle}>
                  {meals.find((meal) => meal.id === currentComparison.rightId)?.title ?? "Unknown meal"}
                </Text>
                <Text style={styles.compareCopy}>
                  {meals.find((meal) => meal.id === currentComparison.rightId)?.caption ?? "No caption yet."}
                </Text>
                <Button
                  label="Prefer current ranked meal"
                  variant="secondary"
                  onPress={() => choosePreferred(currentComparison.rightId, currentComparison.rightId)}
                  loading={comparisonMutation.isPending}
                />
              </View>
            </View>
          </View>
        </Card>
      ) : proposedOrder.length > 0 ? (
        <Card>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Proposed rank order</Text>
            <Text style={styles.helper}>The comparison flow is complete. Save this order to update your library.</Text>
            <View style={styles.orderList}>
              {proposedOrder.map((meal, index) => (
                <Text key={meal.id} style={styles.orderItem}>
                  #{index + 1} {meal.title}
                </Text>
              ))}
            </View>
            {message ? <Text style={styles.helper}>{message}</Text> : null}
            <Button label="Save new order" loading={rankMutation.isPending} onPress={saveRankOrder} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function buildProposedOrder(
  meals: Array<{ id: string; title: string }>,
  subjectMealId: string,
  insertionIndex: number
) {
  const remainingMeals = meals.filter((meal) => meal.id !== subjectMealId);
  const subjectMeal = meals.find((meal) => meal.id === subjectMealId);

  if (!subjectMeal) {
    return remainingMeals;
  }

  const nextMeals = [...remainingMeals];
  nextMeals.splice(insertionIndex, 0, subjectMeal);
  return nextMeals;
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl * 1.2
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
    maxWidth: 360
  },
  block: {
    gap: theme.spacing.md
  },
  blockTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    fontWeight: "700"
  },
  helper: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  selectorList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  compareGrid: {
    gap: theme.spacing.md
  },
  compareCard: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  compareLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  compareTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 20,
    fontWeight: "700"
  },
  compareCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  orderList: {
    gap: theme.spacing.xs
  },
  orderItem: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    fontWeight: "700"
  }
});
