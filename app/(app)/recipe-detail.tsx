import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native";

import { Button, Card, ErrorState, LoadingState, MealPhoto } from "../../components/ui";
import { theme } from "../../constants/theme";
import { getRecipeById, getRecipeVersionChain, deleteRecipe } from "../../lib/api/recipes";
import { listMealsByRecipeFamily } from "../../lib/api/meals";
import { useSessionStore } from "../../store/session";
import { formatRelativeTime } from "../../features/feed/format";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const currentUser = useSessionStore((state) => state.user);

  const query = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId!),
    enabled: Boolean(recipeId)
  });

  const mealsQuery = useQuery({
    queryKey: ["recipe-meals", recipeId],
    queryFn: () => listMealsByRecipeFamily(recipeId!),
    enabled: Boolean(recipeId)
  });

  const versionsQuery = useQuery({
    queryKey: ["recipe-versions", recipeId],
    queryFn: () => getRecipeVersionChain(recipeId!),
    enabled: Boolean(recipeId)
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(recipeId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recipes-with-stats"] });
      router.back();
    }
  });

  if (!recipeId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState title="Missing recipe ID" description="No recipe identifier was provided." />
      </SafeAreaView>
    );
  }

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState title="Loading recipe" description="Fetching recipe details." />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          title="Could not load recipe"
          description={query.error instanceof Error ? query.error.message : "Something went wrong."}
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const recipe = query.data;
  const isOwner = currentUser?.id === recipe.ownerId;
  const meals = mealsQuery.data ?? [];
  const recentMeals = meals.slice(0, 3);
  const totalMinutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  // Version chain sorted oldest → newest
  const versions = (versionsQuery.data ?? []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const hasVersionHistory = versions.length > 1;

  function confirmDelete() {
    Alert.alert(
      "Delete recipe",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Button label="← Back" variant="ghost" size="sm" onPress={() => router.back()} style={styles.backButton} />
          <Text style={styles.sectionLabel}>Recipe</Text>
        </View>

        {/* Title card */}
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <View style={[styles.statusPill, recipe.status === "published" ? styles.statusPublished : styles.statusDraft]}>
              <Text style={[styles.statusText, recipe.status === "published" ? styles.statusTextPublished : styles.statusTextDraft]}>
                {recipe.status}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              {meals.length > 0
                ? `cooked ${meals.length}×${meals.length > 0 && recipe.createdAt ? ` · last ${formatRelativeTime(meals[0].createdAt)}` : ""}`
                : "never cooked yet"}
            </Text>
            {recipe.versionNumber > 1 ? (
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{recipe.versionNumber}</Text>
              </View>
            ) : null}
          </View>

          {recipe.description ? <Text style={styles.description}>{recipe.description}</Text> : null}

          <View style={styles.metaGrid}>
            {recipe.cuisine ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Cuisine</Text>
                <Text style={styles.metaChipValue}>{recipe.cuisine}</Text>
              </View>
            ) : null}
            {recipe.servings ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Serves</Text>
                <Text style={styles.metaChipValue}>{recipe.servings}</Text>
              </View>
            ) : null}
            {recipe.prepTimeMinutes ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Prep</Text>
                <Text style={styles.metaChipValue}>{recipe.prepTimeMinutes}m</Text>
              </View>
            ) : null}
            {recipe.cookTimeMinutes ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Cook</Text>
                <Text style={styles.metaChipValue}>{recipe.cookTimeMinutes}m</Text>
              </View>
            ) : null}
            {totalMinutes > 0 ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Total</Text>
                <Text style={styles.metaChipValue}>{totalMinutes}m</Text>
              </View>
            ) : null}
          </View>

          {recipe.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {recipe.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {recipe.dietaryLabels.length > 0 ? (
            <View style={styles.tagRow}>
              {recipe.dietaryLabels.map((label) => (
                <View key={label} style={styles.dietaryTag}>
                  <Text style={styles.dietaryTagText}>{label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Cover photo */}
        {recipe.coverImageUrl ? (
          <Card contentStyle={styles.imageCard}>
            <Image source={{ uri: recipe.coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
          </Card>
        ) : null}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientList}>
              {recipe.ingredients.map((ingredient) => (
                <View key={ingredient.id} style={styles.ingredientRow}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientText}>
                    {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
                    {ingredient.note ? <Text style={styles.ingredientNote}>{` (${ingredient.note})`}</Text> : null}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Steps */}
        {recipe.steps.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>Steps</Text>
            <View style={styles.stepList}>
              {recipe.steps.map((step, index) => (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.instructionText}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Recent meals */}
        {recentMeals.length > 0 ? (
          <Card>
            <Text style={styles.sectionTitle}>Recent meals</Text>
            <View style={styles.recentMeals}>
              {recentMeals.map((meal) => (
                <View key={meal.id} style={styles.recentMealItem}>
                  <MealPhoto uri={meal.heroImageUrl} size={72} />
                  <Text style={styles.recentMealDate}>{formatRelativeTime(meal.createdAt)}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Version history */}
        {hasVersionHistory ? (
          <Card>
            <Text style={styles.sectionTitle}>Version history</Text>
            <View style={styles.versionList}>
              {versions.map((v, index) => (
                <Button
                  key={v.id}
                  label={`v${v.versionNumber} — ${index === versions.length - 1 ? "current" : formatRelativeTime(v.createdAt)}`}
                  variant={v.id === recipeId ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => v.id !== recipeId && router.push({ pathname: "/(app)/recipe-detail", params: { recipeId: v.id } })}
                />
              ))}
            </View>
          </Card>
        ) : null}

        {/* Owner actions */}
        {isOwner ? (
          <Card>
            <View style={styles.ownerSection}>
              <Text style={styles.ownerSectionTitle}>Owner actions</Text>
              <Button
                label="Edit recipe"
                variant="secondary"
                fullWidth
                onPress={() => router.push({ pathname: "/(app)/edit-recipe", params: { recipeId: recipe.id } })}
              />
              {meals.length === 0 ? (
                <Button
                  label="Delete recipe"
                  variant="ghost"
                  fullWidth
                  loading={deleteMutation.isPending}
                  onPress={confirmDelete}
                  style={styles.deleteButton}
                />
              ) : null}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl
  },
  header: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.md
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 0
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
  statusPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  statusPublished: { backgroundColor: "#d1f0e0" },
  statusDraft: { backgroundColor: theme.colors.surfaceStrong },
  statusText: { fontFamily: theme.fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  statusTextPublished: { color: theme.colors.success },
  statusTextDraft: { color: theme.colors.muted },

  statsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  statText: {
    ...theme.type.caption,
    color: theme.colors.muted
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

  description: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  metaChip: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.sm,
    gap: 2,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  metaChipLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  metaChipValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 15
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  tag: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  tagText: { color: theme.colors.accent, fontFamily: theme.fonts.sansBold, fontSize: 12 },
  dietaryTag: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  dietaryTagText: { color: theme.colors.muted, fontFamily: theme.fonts.sansBold, fontSize: 12 },

  imageCard: { padding: 0, overflow: "hidden", borderRadius: theme.radius.lg },
  coverImage: { borderRadius: theme.radius.lg, height: 220, width: "100%" },

  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.serifBold, fontSize: 18 },

  ingredientList: { gap: theme.spacing.sm },
  ingredientRow: { alignItems: "flex-start", flexDirection: "row", gap: theme.spacing.sm },
  ingredientBullet: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: 6,
    marginTop: 8,
    width: 6
  },
  ingredientText: { color: theme.colors.text, flex: 1, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22 },
  ingredientNote: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 13 },

  stepList: { gap: theme.spacing.md },
  stepRow: { alignItems: "flex-start", flexDirection: "row", gap: theme.spacing.md },
  stepNumber: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: "center",
    minWidth: 28
  },
  stepNumberText: { color: theme.colors.accent, fontFamily: theme.fonts.sansBold, fontSize: 13 },
  stepText: { color: theme.colors.text, flex: 1, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 22, paddingTop: 4 },

  recentMeals: { flexDirection: "row", gap: theme.spacing.sm },
  recentMealItem: { alignItems: "center", gap: theme.spacing.xxs },
  recentMealDate: { ...theme.type.caption, color: theme.colors.muted },

  versionList: { gap: theme.spacing.xs },

  ownerSection: { gap: theme.spacing.sm },
  ownerSectionTitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  deleteButton: { opacity: 0.6 }
});
