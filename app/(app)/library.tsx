import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, EmptyState, ErrorState, Input, LoadingState, MealPhoto } from "../../components/ui";
import { theme } from "../../constants/theme";
import { listRecipesWithStats } from "../../lib/api/recipes";
import { listMeals } from "../../lib/api/meals";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";
import { formatRelativeTime } from "../../features/feed/format";
import type { RecipeWithStats } from "../../types/domain";

type LibraryTab = "recipes" | "meals";
type MealSortMode = "rank" | "newest" | "oldest";
type MealFilterMode = "all" | "public" | "followers" | "private";

export default function LibraryScreen() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const userId = user?.id ?? null;
  const [tab, setTab] = useState<LibraryTab>("recipes");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Library</Text>
      </View>

      <View style={styles.segmentedControl}>
        {(["recipes", "meals"] as LibraryTab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.segment, tab === t && styles.segmentActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "recipes" ? (
        <RecipesTab userId={userId} router={router} />
      ) : (
        <MealsTab userId={userId} router={router} />
      )}
    </SafeAreaView>
  );
}

// ─── Recipes tab ─────────────────────────────────────────────────────────────

function RecipesTab({ userId, router }: { userId: string | null; router: ReturnType<typeof useRouter> }) {
  const recipesQuery = useQuery({
    queryKey: ["recipes-with-stats", userId],
    queryFn: () => listRecipesWithStats(userId!),
    enabled: isSupabaseConfigured && Boolean(userId)
  });

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.stateWrap}>
        <EmptyState title="Connect Supabase" description="Add your environment variables to load your recipes." />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.stateWrap}>
        <EmptyState title="Sign in" description="Your ranked recipe library will appear here." />
      </View>
    );
  }

  if (recipesQuery.isLoading) {
    return <View style={styles.stateWrap}><LoadingState title="Loading recipes" /></View>;
  }

  if (recipesQuery.isError) {
    return (
      <View style={styles.stateWrap}>
        <ErrorState title="Couldn't load recipes" onAction={() => recipesQuery.refetch()} />
      </View>
    );
  }

  const recipes = recipesQuery.data ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {recipes.length === 0 ? (
        <EmptyState title="No recipes yet" description="Create your first recipe to start your library." />
      ) : (
        <View style={styles.list}>
          {recipes.map((recipe) => (
            <RecipeRow
              key={recipe.id}
              recipe={recipe}
              onPress={() => router.push({ pathname: "/(app)/recipe-detail", params: { recipeId: recipe.id } })}
            />
          ))}
        </View>
      )}

      {recipes.length >= 2 ? (
        <Button
          label="Open ranking lab"
          variant="ghost"
          size="sm"
          onPress={() => router.push({ pathname: "/(app)/ranking", params: { entityType: "recipe" } })}
        />
      ) : null}
    </ScrollView>
  );
}

function RecipeRow({ recipe, onPress }: { recipe: RecipeWithStats; onPress: () => void }) {
  const subtitle = [
    recipe.mealCount > 0 ? `cooked ${recipe.mealCount}×` : "never cooked",
    recipe.lastCookedAt ? `last ${formatRelativeTime(recipe.lastCookedAt)}` : null
  ].filter(Boolean).join(" · ");

  return (
    <Pressable
      style={({ pressed }) => [styles.recipeRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.photoWrap}>
        <MealPhoto uri={recipe.coverImageUrl} size={72} />
        <View style={styles.rankBadge}>
          <Text style={styles.rankNum}>{recipe.rankPosition}</Text>
        </View>
      </View>
      <View style={styles.recipeInfo}>
        <View style={styles.recipeTitleRow}>
          <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
          {recipe.versionNumber > 1 ? (
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{recipe.versionNumber}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.recipeMeta} numberOfLines={1}>{subtitle}</Text>
        {recipe.cuisine ? (
          <Text style={styles.recipeCuisine} numberOfLines={1}>{recipe.cuisine}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
    </Pressable>
  );
}

// ─── Meals tab ───────────────────────────────────────────────────────────────

function MealsTab({ userId, router }: { userId: string | null; router: ReturnType<typeof useRouter> }) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<MealSortMode>("rank");
  const [filterMode, setFilterMode] = useState<MealFilterMode>("all");

  const mealsQuery = useQuery({
    queryKey: ["meals", userId],
    queryFn: () => listMeals(userId!),
    enabled: isSupabaseConfigured && Boolean(userId)
  });

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.stateWrap}>
        <EmptyState title="Connect Supabase" description="Add your environment variables to load your meals." />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.stateWrap}>
        <EmptyState title="Sign in" description="Your meal history will appear here." />
      </View>
    );
  }

  if (mealsQuery.isLoading) {
    return <View style={styles.stateWrap}><LoadingState title="Loading meals" /></View>;
  }

  if (mealsQuery.isError) {
    return (
      <View style={styles.stateWrap}>
        <ErrorState title="Couldn't load meals" onAction={() => mealsQuery.refetch()} />
      </View>
    );
  }

  const meals = mealsQuery.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const searched = meals.filter((meal) => {
    if (!normalizedQuery) return true;
    return (
      meal.title.toLowerCase().includes(normalizedQuery) ||
      (meal.caption?.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });
  const filtered = filterMode === "all" ? searched : searched.filter((m) => m.visibility === filterMode);
  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "rank") return a.rankPosition - b.rankPosition;
    if (sortMode === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      <Input placeholder="Search meals..." value={query} onChangeText={setQuery} />

      <View style={styles.chips}>
        {(["rank", "newest", "oldest"] as const).map((mode) => (
          <Button
            key={mode}
            label={mode === "rank" ? "By rank" : mode === "newest" ? "Newest" : "Oldest"}
            size="sm"
            variant={sortMode === mode ? "primary" : "secondary"}
            onPress={() => setSortMode(mode)}
          />
        ))}
      </View>

      <View style={styles.chips}>
        {(["all", "public", "followers", "private"] as const).map((mode) => (
          <Button
            key={mode}
            label={mode.charAt(0).toUpperCase() + mode.slice(1)}
            size="sm"
            variant={filterMode === mode ? "primary" : "secondary"}
            onPress={() => setFilterMode(mode)}
          />
        ))}
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          title={meals.length === 0 ? "No meals yet" : "No results"}
          description={meals.length === 0 ? "Create your first meal to start your history." : "Try a different search or filter."}
        />
      ) : (
        <View style={styles.list}>
          {sorted.map((meal) => (
            <Pressable
              key={meal.id}
              style={({ pressed }) => [styles.mealRow, pressed && styles.rowPressed]}
              onPress={() => router.push({ pathname: "/(app)/meal-detail", params: { mealId: meal.id } })}
            >
              <View style={styles.photoWrap}>
                <MealPhoto uri={meal.heroImageUrl} size={72} />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNum}>{meal.rankPosition}</Text>
                </View>
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={1}>{meal.title}</Text>
                <Text style={styles.recipeMeta}>{meal.visibility} · {formatRelativeTime(meal.createdAt)}</Text>
                {meal.caption ? <Text style={styles.recipeCuisine} numberOfLines={1}>{meal.caption}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },
  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs
  },
  pageTitle: {
    ...theme.type.hero,
    color: theme.colors.text
  },

  // Segmented control
  segmentedControl: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: 3
  },
  segment: {
    borderRadius: theme.radius.pill,
    flex: 1,
    paddingVertical: theme.spacing.xs,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card
  },
  segmentText: {
    ...theme.type.label,
    color: theme.colors.muted
  },
  segmentTextActive: {
    color: theme.colors.text
  },

  // Content
  stateWrap: {
    flex: 1,
    padding: theme.spacing.lg
  },
  listContent: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl
  },

  // Rows
  list: {
    gap: 2
  },
  recipeRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.sm,
    ...theme.shadow.card
  },
  mealRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.sm,
    ...theme.shadow.card
  },
  rowPressed: {
    transform: [{ scale: 0.985 }]
  },
  photoWrap: {
    position: "relative"
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    bottom: -4,
    height: 24,
    justifyContent: "center",
    left: -4,
    minWidth: 24,
    paddingHorizontal: 4,
    position: "absolute"
  },
  rankNum: {
    color: theme.colors.white,
    fontFamily: theme.fonts.sansBold,
    fontSize: 11
  },
  recipeInfo: {
    flex: 1,
    gap: 2
  },
  recipeTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  recipeTitle: {
    ...theme.type.bodyMedium,
    color: theme.colors.text,
    flex: 1
  },
  versionBadge: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2
  },
  versionText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10
  },
  recipeMeta: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  recipeCuisine: {
    ...theme.type.caption,
    color: theme.colors.muted
  },

  // Meals tab extras
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  }
});
