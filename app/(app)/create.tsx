import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, Card, EmptyState, ErrorState, Input, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { mealFormSchema, recipeFormSchema, type MealFormValues, type RecipeFormValues } from "../../features/create/schemas";
import { createMeal, listMeals } from "../../lib/api/meals";
import { createRecipe, listRecipes } from "../../lib/api/recipes";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { pickAndUploadImage } from "../../lib/upload";
import { useSessionStore } from "../../store/session";

type StepValue = {
  instructionText: string;
  ingredientRefs: number[];
};

const initialRecipeValues: RecipeFormValues = {
  title: "",
  description: "",
  cuisine: "",
  servings: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  tags: "",
  dietaryLabels: "",
  ingredients: [{ name: "", quantity: "", unit: "", note: "" }],
  steps: [{ instructionText: "" }],
  status: "draft"
};

const initialMealValues: MealFormValues = {
  recipeId: "",
  title: "",
  caption: "",
  heroImageUrl: "",
  visibility: "public"
};

export default function CreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [recipeValues, setRecipeValues] = useState<RecipeFormValues>(initialRecipeValues);
  const [stepRefs, setStepRefs] = useState<number[][]>([[]]); // parallel array to recipeValues.steps
  const [mealValues, setMealValues] = useState<MealFormValues>(initialMealValues);
  const [recipeMessage, setRecipeMessage] = useState<string | null>(null);
  const [mealMessage, setMealMessage] = useState<string | null>(null);
  const [recipeCoverUri, setRecipeCoverUri] = useState<string | null>(null);
  const [mealHeroUri, setMealHeroUri] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const userId = user?.id ?? null;
  const canQuery = isSupabaseConfigured && Boolean(userId);

  const recipesQuery = useQuery({
    queryKey: ["recipes", userId],
    queryFn: () => listRecipes(userId!),
    enabled: canQuery
  });

  const mealsQuery = useQuery({
    queryKey: ["meals", userId],
    queryFn: () => listMeals(userId!),
    enabled: canQuery
  });

  const recipeMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: async (recipe) => {
      setRecipeMessage(`Saved "${recipe.title}".`);
      setRecipeValues(initialRecipeValues);
      setStepRefs([[]]);
      setRecipeCoverUri(null);
      setMealValues((current) => ({
        ...current,
        recipeId: recipe.id,
        title: current.title || recipe.title
      }));
      await queryClient.invalidateQueries({ queryKey: ["recipes", userId] });
    },
    onError: (error) => {
      setRecipeMessage(error instanceof Error ? error.message : "Failed to save recipe.");
    }
  });

  const mealMutation = useMutation({
    mutationFn: createMeal,
    onSuccess: async (meal) => {
      setMealValues((current) => ({
        ...initialMealValues,
        recipeId: current.recipeId
      }));
      setMealHeroUri(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", userId] }),
        queryClient.invalidateQueries({ queryKey: ["recipes", userId] })
      ]);

      // After invalidation, check total meal count (existing meals before creation + 1 = new total)
      const existingMealsCount = mealsQuery.data?.length ?? 0;
      const totalMealsAfterCreation = existingMealsCount + 1;

      if (totalMealsAfterCreation >= 2) {
        router.push({
          pathname: "/(app)/ranking",
          params: { subjectMealId: meal.id, mode: "create" }
        });
      } else {
        setMealMessage(`Created meal "${meal.title}" at rank #${meal.rankPosition}.`);
      }
    },
    onError: (error) => {
      setMealMessage(error instanceof Error ? error.message : "Failed to create meal.");
    }
  });

  function updateRecipeValue<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setRecipeValues((current) => ({ ...current, [key]: value }));
  }

  function updateIngredient(index: number, key: keyof RecipeFormValues["ingredients"][number], value: string) {
    setRecipeValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, [key]: value } : ingredient
      )
    }));
  }

  function updateStep(index: number, value: string) {
    setRecipeValues((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, instructionText: value } : step
      )
    }));
  }

  function toggleStepIngredientRef(stepIndex: number, ingredientIndex: number) {
    setStepRefs((current) => {
      const updated = current.map((refs, idx) => {
        if (idx !== stepIndex) return refs;
        return refs.includes(ingredientIndex)
          ? refs.filter((r) => r !== ingredientIndex)
          : [...refs, ingredientIndex];
      });
      return updated;
    });
  }

  function addStep() {
    updateRecipeValue("steps", [...recipeValues.steps, { instructionText: "" }]);
    setStepRefs((current) => [...current, []]);
  }

  async function pickCoverPhoto() {
    if (!userId) return;
    setCoverUploading(true);
    try {
      const url = await pickAndUploadImage({
        bucket: "recipes",
        path: `${userId}/covers/${Date.now()}.jpg`
      });
      if (url) {
        setRecipeCoverUri(url);
      }
    } catch (err) {
      setRecipeMessage(err instanceof Error ? err.message : "Failed to upload cover photo.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function pickHeroPhoto() {
    if (!userId) return;
    setHeroUploading(true);
    try {
      const url = await pickAndUploadImage({
        bucket: "meals",
        path: `${userId}/heroes/${Date.now()}.jpg`
      });
      if (url) {
        setMealHeroUri(url);
      }
    } catch (err) {
      setMealMessage(err instanceof Error ? err.message : "Failed to upload hero photo.");
    } finally {
      setHeroUploading(false);
    }
  }

  async function submitRecipe() {
    setRecipeMessage(null);
    const parsed = recipeFormSchema.safeParse(recipeValues);
    if (!parsed.success) {
      setRecipeMessage(parsed.error.issues[0]?.message ?? "Recipe form is incomplete.");
      return;
    }

    if (!userId) {
      setRecipeMessage("You need an active session before saving recipes.");
      return;
    }

    const allIngredients = parsed.data.ingredients;
    const filteredIngredients = allIngredients.filter((ing) => ing.name.trim().length > 0);
    const fullToFiltered = new Map<number, number>();
    let fi = 0;
    for (let i = 0; i < allIngredients.length; i++) {
      if (allIngredients[i].name.trim().length > 0) fullToFiltered.set(i, fi++);
    }

    await recipeMutation.mutateAsync({
      ownerId: userId,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim() || null,
      coverImageUrl: recipeCoverUri,
      cuisine: parsed.data.cuisine.trim() || null,
      servings: toOptionalNumber(parsed.data.servings),
      prepTimeMinutes: toOptionalNumber(parsed.data.prepTimeMinutes),
      cookTimeMinutes: toOptionalNumber(parsed.data.cookTimeMinutes),
      tags: splitCsv(parsed.data.tags),
      dietaryLabels: splitCsv(parsed.data.dietaryLabels),
      status: parsed.data.status,
      ingredients: filteredIngredients,
      steps: parsed.data.steps.map((step, index) => ({
        instructionText: step.instructionText,
        ingredientReferences: (stepRefs[index] ?? [])
          .map((ref) => fullToFiltered.get(ref))
          .filter((idx): idx is number => idx !== undefined)
          .map(String),
        imageUrl: null
      }))
    });
  }

  async function submitMeal() {
    setMealMessage(null);
    const parsed = mealFormSchema.safeParse(mealValues);
    if (!parsed.success) {
      setMealMessage(parsed.error.issues[0]?.message ?? "Meal form is incomplete.");
      return;
    }

    if (!userId) {
      setMealMessage("You need an active session before creating meals.");
      return;
    }

    await mealMutation.mutateAsync({
      ownerId: userId,
      recipeId: parsed.data.recipeId,
      title: parsed.data.title.trim(),
      caption: parsed.data.caption.trim() || null,
      heroImageUrl: mealHeroUri,
      visibility: parsed.data.visibility
    });
  }

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Create</Text>
          <Text style={styles.title}>Creation is ready for real data as soon as Supabase is configured.</Text>
        </View>
        <EmptyState
          title="Add your Supabase keys"
          description="This screen is wired to the recipe and meal APIs. Add the Expo public Supabase env vars to start saving data."
        />
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Create</Text>
          <Text style={styles.title}>Sign in before you start building recipes and meals.</Text>
        </View>
        <EmptyState
          title="No active session"
          description="The create flow uses your authenticated profile as the recipe and meal owner."
        />
      </Screen>
    );
  }

  if (recipesQuery.isLoading || mealsQuery.isLoading) {
    return (
      <Screen>
        <LoadingState
          title="Loading your kitchen"
          description="Fetching your existing recipes and meals before we open the create flow."
        />
      </Screen>
    );
  }

  if (recipesQuery.isError || mealsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          title="Couldn't load the create flow"
          description="There was a problem loading your recipes or meals."
          onAction={() => {
            recipesQuery.refetch();
            mealsQuery.refetch();
          }}
        />
      </Screen>
    );
  }

  const recipes = recipesQuery.data ?? [];
  const meals = mealsQuery.data ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Create</Text>
        <Text style={styles.title}>Save a recipe first, then turn it into a ranked meal.</Text>
        <Text style={styles.subtitle}>
          {recipes.length} recipes and {meals.length} meals in your account so far.
        </Text>
      </View>

      <Card>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Recipe basics</Text>
          <Input
            label="Title"
            placeholder="Smoky tomato beans"
            value={recipeValues.title}
            onChangeText={(value) => updateRecipeValue("title", value)}
          />
          <Input
            label="Description"
            placeholder="A short note about the dish"
            multiline
            numberOfLines={4}
            value={recipeValues.description}
            onChangeText={(value) => updateRecipeValue("description", value)}
          />
          <View style={styles.row}>
            <Input
              label="Cuisine"
              placeholder="Italian"
              containerStyle={styles.flex}
              value={recipeValues.cuisine}
              onChangeText={(value) => updateRecipeValue("cuisine", value)}
            />
            <Input
              label="Servings"
              placeholder="4"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={recipeValues.servings}
              onChangeText={(value) => updateRecipeValue("servings", value)}
            />
          </View>
          <View style={styles.row}>
            <Input
              label="Prep time"
              placeholder="15"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={recipeValues.prepTimeMinutes}
              onChangeText={(value) => updateRecipeValue("prepTimeMinutes", value)}
            />
            <Input
              label="Cook time"
              placeholder="30"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={recipeValues.cookTimeMinutes}
              onChangeText={(value) => updateRecipeValue("cookTimeMinutes", value)}
            />
          </View>
          <Input
            label="Tags"
            placeholder="weeknight, spicy, pantry"
            value={recipeValues.tags}
            onChangeText={(value) => updateRecipeValue("tags", value)}
          />
          <Input
            label="Dietary labels"
            placeholder="vegetarian, dairy-free"
            value={recipeValues.dietaryLabels}
            onChangeText={(value) => updateRecipeValue("dietaryLabels", value)}
          />
          <View style={styles.photoRow}>
            <Button
              label={coverUploading ? "Uploading..." : recipeCoverUri ? "Change cover photo" : "Add cover photo"}
              size="sm"
              variant="secondary"
              loading={coverUploading}
              onPress={pickCoverPhoto}
            />
            {recipeCoverUri ? (
              <Image source={{ uri: recipeCoverUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : null}
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.block}>
          <View style={styles.sectionHeader}>
            <Text style={styles.blockTitle}>Ingredients</Text>
            <Button
              label="Add ingredient"
              size="sm"
              variant="secondary"
              onPress={() =>
                updateRecipeValue("ingredients", [
                  ...recipeValues.ingredients,
                  { name: "", quantity: "", unit: "", note: "" }
                ])
              }
            />
          </View>
          {recipeValues.ingredients.map((ingredient, index) => (
            <View key={`ingredient-${index}`} style={styles.subBlock}>
              <Input
                label={`Ingredient ${index + 1}`}
                placeholder="Crushed tomatoes"
                value={ingredient.name}
                onChangeText={(value) => updateIngredient(index, "name", value)}
              />
              <View style={styles.row}>
                <Input
                  label="Quantity"
                  placeholder="1"
                  containerStyle={styles.flex}
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredient(index, "quantity", value)}
                />
                <Input
                  label="Unit"
                  placeholder="can"
                  containerStyle={styles.flex}
                  value={ingredient.unit}
                  onChangeText={(value) => updateIngredient(index, "unit", value)}
                />
              </View>
              <Input
                label="Note"
                placeholder="Fire-roasted if possible"
                value={ingredient.note}
                onChangeText={(value) => updateIngredient(index, "note", value)}
              />
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.block}>
          <View style={styles.sectionHeader}>
            <Text style={styles.blockTitle}>Steps</Text>
            <Button
              label="Add step"
              size="sm"
              variant="secondary"
              onPress={addStep}
            />
          </View>
          {recipeValues.steps.map((step, stepIndex) => (
            <View key={`step-${stepIndex}`} style={styles.subBlock}>
              <Input
                label={`Step ${stepIndex + 1}`}
                placeholder="Warm the oil in a skillet..."
                multiline
                numberOfLines={4}
                value={step.instructionText}
                onChangeText={(value) => updateStep(stepIndex, value)}
              />
              {recipeValues.ingredients.some((ing) => ing.name.trim().length > 0) ? (
                <View style={styles.tagIngredientSection}>
                  <Text style={styles.tagIngredientLabel}>Tag ingredients</Text>
                  <View style={styles.chips}>
                    {recipeValues.ingredients.map((ingredient, ingredientIndex) => {
                      if (!ingredient.name.trim()) return null;
                      const isActive = (stepRefs[stepIndex] ?? []).includes(ingredientIndex);
                      return (
                        <Pressable
                          key={`step-${stepIndex}-ing-${ingredientIndex}`}
                          onPress={() => toggleStepIngredientRef(stepIndex, ingredientIndex)}
                          style={[styles.ingredientChip, isActive && styles.ingredientChipActive]}
                        >
                          <Text style={[styles.ingredientChipText, isActive && styles.ingredientChipTextActive]}>
                            {ingredient.name.trim()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
          <View style={styles.chips}>
            <Button
              label="Save as draft"
              variant={recipeValues.status === "draft" ? "primary" : "secondary"}
              size="sm"
              onPress={() => updateRecipeValue("status", "draft")}
            />
            <Button
              label="Mark published"
              variant={recipeValues.status === "published" ? "primary" : "secondary"}
              size="sm"
              onPress={() => updateRecipeValue("status", "published")}
            />
          </View>
          {recipeMessage ? <Text style={styles.helper}>{recipeMessage}</Text> : null}
          <Button label="Save recipe" loading={recipeMutation.isPending} onPress={submitRecipe} />
        </View>
      </Card>

      <Card>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Create meal from recipe</Text>
          {recipes.length === 0 ? (
            <EmptyState
              title="No recipes yet"
              description="Save a recipe above before you create a meal from it."
            />
          ) : (
            <>
              <View style={styles.selectorList}>
                {recipes.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() =>
                      setMealValues((current) => ({
                        ...current,
                        recipeId: recipe.id,
                        title: current.title || recipe.title
                      }))
                    }
                    style={[
                      styles.selectorCard,
                      mealValues.recipeId === recipe.id && styles.selectorCardActive
                    ]}
                  >
                    <Text style={styles.selectorTitle}>{recipe.title}</Text>
                    <Text style={styles.selectorCopy}>
                      {recipe.status === "published" ? "Published" : "Draft"} · {recipe.ingredients.length} ingredients
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Input
                label="Meal title"
                placeholder="Saturday smoky beans"
                value={mealValues.title}
                onChangeText={(value) => setMealValues((current) => ({ ...current, title: value }))}
              />
              <Input
                label="Caption"
                placeholder="Comfort food that earned another spot in the rotation."
                multiline
                numberOfLines={4}
                value={mealValues.caption}
                onChangeText={(value) => setMealValues((current) => ({ ...current, caption: value }))}
              />
              <View style={styles.photoRow}>
                <Button
                  label={heroUploading ? "Uploading..." : mealHeroUri ? "Change hero photo" : "Add hero photo"}
                  size="sm"
                  variant="secondary"
                  loading={heroUploading}
                  onPress={pickHeroPhoto}
                />
                {mealHeroUri ? (
                  <Image source={{ uri: mealHeroUri }} style={styles.photoPreview} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.chips}>
                {(["public", "followers", "private"] as const).map((visibility) => (
                  <Button
                    key={visibility}
                    label={visibility}
                    size="sm"
                    variant={mealValues.visibility === visibility ? "primary" : "secondary"}
                    onPress={() => setMealValues((current) => ({ ...current, visibility }))}
                  />
                ))}
              </View>
              {mealMessage ? <Text style={styles.helper}>{mealMessage}</Text> : null}
              <Button label="Create meal" loading={mealMutation.isPending} onPress={submitMeal} />
            </>
          )}
        </View>
      </Card>
    </Screen>
  );
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
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
    maxWidth: 340
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  flex: {
    flex: 1
  },
  subBlock: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  helper: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  selectorList: {
    gap: theme.spacing.sm
  },
  selectorCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  selectorCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentSoft
  },
  selectorTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    fontWeight: "700"
  },
  selectorCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  photoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  photoPreview: {
    borderRadius: theme.radius.sm,
    height: 60,
    width: 60
  },
  tagIngredientSection: {
    gap: theme.spacing.xs
  },
  tagIngredientLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  ingredientChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  ingredientChipActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  ingredientChipText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700"
  },
  ingredientChipTextActive: {
    color: theme.colors.accent
  }
});
