import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Button, EmptyState, ErrorState, LoadingState, MealPhoto } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { listMeals, updateMealRankOrder } from "../../lib/api/meals";
import { listRecipesWithStats, updateRecipeRankOrder } from "../../lib/api/recipes";
import { recordMealComparison, recordRecipeComparison } from "../../lib/api/ranking";
import { createRankingSession, nextComparison, resolveComparison, type RankingSession } from "../../lib/ranking/insertion";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

type EntityType = "meal" | "recipe";

export default function RankingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectMealId?: string; mode?: "create" | "rerank"; entityType?: EntityType }>();
  const entityType: EntityType = params.entityType === "recipe" ? "recipe" : "meal";
  const paramSubjectId = typeof params.subjectMealId === "string" && params.subjectMealId ? params.subjectMealId : null;
  const mode = params.mode === "create" ? "create" : "rerank";

  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const userId = user?.id ?? null;
  const [subjectId, setSubjectId] = useState<string | null>(paramSubjectId);
  const [paramApplied, setParamApplied] = useState(false);
  const [session, setSession] = useState<RankingSession | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const mealsQuery = useQuery({
    queryKey: ["meals", userId],
    queryFn: () => listMeals(userId!),
    enabled: isSupabaseConfigured && Boolean(userId) && entityType === "meal"
  });

  const recipesQuery = useQuery({
    queryKey: ["recipes-with-stats", userId],
    queryFn: () => listRecipesWithStats(userId!),
    enabled: isSupabaseConfigured && Boolean(userId) && entityType === "recipe"
  });

  const items = useMemo(
    () => entityType === "recipe"
      ? (recipesQuery.data ?? []).map((r) => ({ id: r.id, title: r.title, imageUrl: r.coverImageUrl, rankPosition: r.rankPosition }))
      : (mealsQuery.data ?? []).map((m) => ({ id: m.id, title: m.title, imageUrl: m.heroImageUrl, rankPosition: m.rankPosition })),
    [entityType, recipesQuery.data, mealsQuery.data]
  );

  const isLoading = entityType === "recipe" ? recipesQuery.isLoading : mealsQuery.isLoading;
  const isError = entityType === "recipe" ? recipesQuery.isError : mealsQuery.isError;

  // ── Comparison mutation ────────────────────────────────────────────────────
  const mealComparisonMutation = useMutation({ mutationFn: recordMealComparison });
  const recipeComparisonMutation = useMutation({ mutationFn: recordRecipeComparison });

  const rankMutation = useMutation({
    mutationFn: async ({ ownerId, orderedIds }: { ownerId: string; orderedIds: string[] }) => {
      if (entityType === "recipe") return updateRecipeRankOrder(ownerId, orderedIds);
      return updateMealRankOrder(ownerId, orderedIds);
    },
    onSuccess: async () => {
      setMessage("Rankings saved.");
      if (entityType === "recipe") {
        await queryClient.invalidateQueries({ queryKey: ["recipes-with-stats", userId] });
      } else {
        await queryClient.invalidateQueries({ queryKey: ["meals", userId] });
      }
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to save rankings.");
    }
  });

  // ── Session setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paramSubjectId && !paramApplied && items.length > 0) {
      if (items.some((i) => i.id === paramSubjectId)) setSubjectId(paramSubjectId);
      setParamApplied(true);
      return;
    }
    if (!paramSubjectId && !subjectId && items.length > 0) {
      setSubjectId(items[0]?.id ?? null);
    }
  }, [paramSubjectId, paramApplied, subjectId, items]);

  const subjectItem = items.find((i) => i.id === subjectId) ?? null;
  const comparisonItems = useMemo(
    () => items.filter((i) => i.id !== subjectId).map((i) => ({ id: i.id, rankPosition: i.rankPosition })),
    [items, subjectId]
  );

  useEffect(() => {
    if (!subjectId) { setSession(null); return; }
    setSession(createRankingSession(subjectId, comparisonItems));
    setMessage(null);
  }, [subjectId, comparisonItems]);

  const currentComparison = session ? nextComparison(session, comparisonItems) : null;
  const proposedOrder = session && subjectItem
    ? buildProposedOrder(items, subjectItem.id, session.low)
    : [];

  async function choosePreferred(preferredId: string, comparedAgainstId: string) {
    if (!session || !subjectId || !userId) return;
    setSession(resolveComparison(session, comparisonItems, preferredId, comparedAgainstId));
    if (entityType === "recipe") {
      await recipeComparisonMutation.mutateAsync({
        userId,
        subjectRecipeId: subjectId,
        comparedAgainstRecipeId: comparedAgainstId,
        preferredRecipeId: preferredId
      });
    } else {
      await mealComparisonMutation.mutateAsync({
        userId,
        subjectMealId: subjectId,
        comparedAgainstMealId: comparedAgainstId,
        preferredMealId: preferredId
      });
    }
  }

  async function saveRankOrder() {
    if (!userId || proposedOrder.length === 0) return;
    await rankMutation.mutateAsync({ ownerId: userId, orderedIds: proposedOrder.map((i) => i.id) });
  }

  // ── Edge states ────────────────────────────────────────────────────────────
  const entityLabel = entityType === "recipe" ? "recipes" : "meals";

  if (!isSupabaseConfigured || !userId) {
    return (
      <Screen>
        <Text style={styles.pageTitle}>Ranking</Text>
        <EmptyState title={!isSupabaseConfigured ? "Connect Supabase" : "Sign in first"} description={`Ranking needs your ${entityLabel} loaded.`} />
      </Screen>
    );
  }

  if (isLoading) {
    return <Screen><LoadingState title={`Loading ${entityLabel}`} /></Screen>;
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          title={`Couldn't load ${entityLabel}`}
          onAction={() => entityType === "recipe" ? recipesQuery.refetch() : mealsQuery.refetch()}
        />
      </Screen>
    );
  }

  if (items.length < 2) {
    return (
      <Screen>
        <Text style={styles.pageTitle}>Ranking</Text>
        <EmptyState
          title={`Need at least two ${entityLabel}`}
          description={`Create another ${entityType === "recipe" ? "recipe" : "meal"}, then come back to rank them.`}
        />
      </Screen>
    );
  }

  // ── Item selector (no subject param) ──────────────────────────────────────
  if (!paramSubjectId && !currentComparison && proposedOrder.length === 0) {
    return (
      <Screen>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Ranking</Text>
          <Button label="Cancel" size="sm" variant="ghost" onPress={() => router.back()} />
        </View>
        <Text style={styles.subtitle}>Pick a {entityType} to rank.</Text>
        <View style={styles.selectorList}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.selectorCard, item.id === subjectId && styles.selectorCardActive]}
              onPress={() => setSubjectId(item.id)}
            >
              <MealPhoto uri={item.imageUrl} size={48} />
              <View style={styles.selectorInfo}>
                <Text style={styles.selectorTitle}>#{item.rankPosition} {item.title}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  // ── Active comparison ──────────────────────────────────────────────────────
  if (currentComparison && subjectItem) {
    const opponent = items.find((i) => i.id === currentComparison.rightId);
    const totalSteps = Math.ceil(Math.log2(Math.max(comparisonItems.length, 1)));
    const currentStep = totalSteps - (session ? Math.ceil(Math.log2(Math.max(session.high - session.low, 1))) : 0);
    const isPending = mealComparisonMutation.isPending || recipeComparisonMutation.isPending;

    return (
      <Screen scroll={false} contentStyle={styles.comparisonScreen}>
        <View style={styles.comparisonHeader}>
          <Button label="Cancel" size="sm" variant="ghost" onPress={() => router.back()} />
          <Text style={styles.comparisonQuestion}>
            {entityType === "recipe" ? "Which would you cook more?" : "Which is better?"}
          </Text>
          <Text style={styles.progress}>{currentStep}/{totalSteps}</Text>
        </View>

        <View style={styles.comparisonCards}>
          <Pressable
            style={({ pressed }) => [styles.compCard, pressed && styles.compCardPressed]}
            onPress={() => choosePreferred(subjectItem.id, currentComparison.rightId)}
            disabled={isPending}
          >
            <MealPhoto uri={subjectItem.imageUrl} style={styles.compPhoto} />
            <LinearGradient colors={["transparent", theme.colors.overlay]} style={styles.scrim} />
            <View style={styles.compLabel}>
              <Text style={styles.compTitle} numberOfLines={2}>{subjectItem.title}</Text>
              {mode === "create" ? <Text style={styles.compTag}>New {entityType}</Text> : null}
            </View>
          </Pressable>

          <View style={styles.orDivider}>
            <Text style={styles.orText}>or</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.compCard, pressed && styles.compCardPressed]}
            onPress={() => choosePreferred(currentComparison.rightId, currentComparison.rightId)}
            disabled={isPending}
          >
            <MealPhoto uri={opponent?.imageUrl} style={styles.compPhoto} />
            <LinearGradient colors={["transparent", theme.colors.overlay]} style={styles.scrim} />
            <View style={styles.compLabel}>
              <Text style={styles.compTitle} numberOfLines={2}>{opponent?.title ?? "Unknown"}</Text>
              <Text style={styles.compTag}>Ranked #{currentComparison.pivotIndex + 1}</Text>
            </View>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── Ranking complete ───────────────────────────────────────────────────────
  const subjectNewRank = proposedOrder.findIndex((i) => i.id === subjectId) + 1;

  return (
    <Screen contentStyle={styles.doneScreen}>
      <View style={styles.doneContent}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
        </View>
        <Text style={styles.doneTitle}>
          {subjectItem?.title ?? `Your ${entityType}`} is now #{subjectNewRank}
        </Text>
        <Text style={styles.doneSubtitle}>
          Out of {proposedOrder.length} {entityLabel} in your library.
        </Text>

        <View style={styles.proposedList}>
          {proposedOrder.map((item, index) => (
            <View key={item.id} style={[styles.proposedRow, item.id === subjectId && styles.proposedRowHighlight]}>
              <Text style={styles.proposedRank}>#{index + 1}</Text>
              <Text style={styles.proposedTitle}>{item.title}</Text>
            </View>
          ))}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <View style={styles.doneActions}>
        <Button label="Save rankings" fullWidth loading={rankMutation.isPending} onPress={saveRankOrder} />
        <Button label="Back to library" fullWidth variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function buildProposedOrder(
  items: Array<{ id: string; title: string }>,
  subjectId: string,
  insertionIndex: number
) {
  const rest = items.filter((i) => i.id !== subjectId);
  const subject = items.find((i) => i.id === subjectId);
  if (!subject) return rest;
  const next = [...rest];
  next.splice(insertionIndex, 0, subject);
  return next;
}

const styles = StyleSheet.create({
  pageTitle: {
    ...theme.type.hero,
    color: theme.colors.text,
    paddingTop: theme.spacing.xl
  },
  subtitle: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },

  selectorList: { gap: theme.spacing.xs },
  selectorCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm
  },
  selectorCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft
  },
  selectorInfo: { flex: 1 },
  selectorTitle: {
    ...theme.type.bodyMedium,
    color: theme.colors.text
  },

  comparisonScreen: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: 0
  },
  comparisonHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm
  },
  comparisonQuestion: {
    ...theme.type.title,
    color: theme.colors.text
  },
  progress: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  comparisonCards: {
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center"
  },
  compCard: {
    borderRadius: theme.radius.xl,
    flex: 1,
    overflow: "hidden",
    position: "relative",
    maxHeight: "45%"
  },
  compCardPressed: { transform: [{ scale: 0.98 }] },
  compPhoto: { borderRadius: 0, height: "100%", width: "100%" },
  scrim: { bottom: 0, height: "50%", left: 0, position: "absolute", right: 0 },
  compLabel: { bottom: 0, left: 0, padding: theme.spacing.lg, position: "absolute", right: 0 },
  compTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.serifBold,
    fontSize: 22,
    lineHeight: 28
  },
  compTag: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    marginTop: 2
  },
  orDivider: { alignItems: "center", justifyContent: "center" },
  orText: { ...theme.type.caption, color: theme.colors.muted },

  doneScreen: { justifyContent: "space-between" },
  doneContent: { alignItems: "center", gap: theme.spacing.md, paddingTop: theme.spacing.xxl },
  doneIcon: { marginBottom: theme.spacing.xs },
  doneTitle: {
    ...theme.type.title,
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 24
  },
  doneSubtitle: { ...theme.type.body, color: theme.colors.muted, textAlign: "center" },
  proposedList: { gap: theme.spacing.xxs, width: "100%", paddingTop: theme.spacing.md },
  proposedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm
  },
  proposedRowHighlight: { backgroundColor: theme.colors.accentSoft },
  proposedRank: { ...theme.type.label, color: theme.colors.muted, width: 28 },
  proposedTitle: { ...theme.type.bodyMedium, color: theme.colors.text, flex: 1 },
  message: { ...theme.type.body, color: theme.colors.muted, textAlign: "center" },
  doneActions: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md }
});
