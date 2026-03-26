import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image, StyleSheet, Text, View } from "react-native";

import { Button, Card, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { getRecipeById } from "../../lib/api/recipes";
import { useSessionStore } from "../../store/session";

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const currentUser = useSessionStore((state) => state.user);

  const query = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId!),
    enabled: Boolean(recipeId)
  });

  if (!recipeId) {
    return (
      <Screen>
        <ErrorState title="Missing recipe ID" description="No recipe identifier was provided." />
      </Screen>
    );
  }

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingState title="Loading recipe" description="Fetching recipe details." />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="Could not load recipe"
          description={query.error instanceof Error ? query.error.message : "Something went wrong."}
          actionLabel="Retry"
          onAction={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const recipe = query.data;
  const isOwner = currentUser?.id === recipe.ownerId;

  const totalMinutes =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.backRow}>
          <Button
            label="← Back"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
        <Text style={styles.sectionLabel}>Recipe</Text>
      </View>

      <Card>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View
            style={[
              styles.statusPill,
              recipe.status === "published" ? styles.statusPublished : styles.statusDraft
            ]}
          >
            <Text
              style={[
                styles.statusText,
                recipe.status === "published" ? styles.statusTextPublished : styles.statusTextDraft
              ]}
            >
              {recipe.status}
            </Text>
          </View>
        </View>

        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}

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

      {recipe.coverImageUrl ? (
        <Card contentStyle={styles.imageCard}>
          <Image
            source={{ uri: recipe.coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </Card>
      ) : null}

      {recipe.ingredients.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientRow}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {[ingredient.quantity, ingredient.unit, ingredient.name]
                    .filter(Boolean)
                    .join(" ")}
                  {ingredient.note ? (
                    <Text style={styles.ingredientNote}>{` (${ingredient.note})`}</Text>
                  ) : null}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

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
  backRow: {
    alignItems: "flex-start"
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 0
  },
  sectionLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
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
    fontFamily: theme.fonts.display,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32
  },
  statusPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  statusPublished: {
    backgroundColor: "#d1f0e0"
  },
  statusDraft: {
    backgroundColor: theme.colors.surfaceStrong
  },
  statusText: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  statusTextPublished: {
    color: theme.colors.success
  },
  statusTextDraft: {
    color: theme.colors.muted
  },
  description: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
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
    fontFamily: theme.fonts.body,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  metaChipValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 15,
    fontWeight: "700"
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
  tagText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700"
  },
  dietaryTag: {
    backgroundColor: theme.colors.surfaceStrong,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  dietaryTagText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700"
  },
  imageCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: theme.radius.lg
  },
  coverImage: {
    borderRadius: theme.radius.lg,
    height: 220,
    width: "100%"
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: "700"
  },
  ingredientList: {
    gap: theme.spacing.sm
  },
  ingredientRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  ingredientBullet: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    height: 6,
    marginTop: 8,
    width: 6
  },
  ingredientText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22
  },
  ingredientNote: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  stepList: {
    gap: theme.spacing.md
  },
  stepRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    height: 28,
    justifyContent: "center",
    minWidth: 28
  },
  stepNumberText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "800"
  },
  stepText: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    paddingTop: 4
  },
  ownerSection: {
    gap: theme.spacing.sm
  },
  ownerSectionTitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase"
  }
});
