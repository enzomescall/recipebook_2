import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button, Card, ErrorState, Input, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { getRecipeById, updateRecipe } from "../../lib/api/recipes";
import { pickAndUploadImage } from "../../lib/upload";
import { useSessionStore } from "../../store/session";
import type { Recipe } from "../../types/domain";

type EditIngredient = {
  name: string;
  quantity: string;
  unit: string;
  note: string;
};

type EditStep = {
  instructionText: string;
  ingredientRefs: number[];
};

function recipeToFormState(recipe: Recipe): {
  title: string;
  description: string;
  cuisine: string;
  servings: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  tags: string;
  dietaryLabels: string;
  status: "draft" | "published";
  ingredients: EditIngredient[];
  steps: EditStep[];
} {
  return {
    title: recipe.title,
    description: recipe.description ?? "",
    cuisine: recipe.cuisine ?? "",
    servings: recipe.servings != null ? String(recipe.servings) : "",
    prepTimeMinutes: recipe.prepTimeMinutes != null ? String(recipe.prepTimeMinutes) : "",
    cookTimeMinutes: recipe.cookTimeMinutes != null ? String(recipe.cookTimeMinutes) : "",
    tags: recipe.tags.join(", "),
    dietaryLabels: recipe.dietaryLabels.join(", "),
    status: recipe.status,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity ?? "",
            unit: ing.unit ?? "",
            note: ing.note ?? ""
          }))
        : [{ name: "", quantity: "", unit: "", note: "" }],
    steps:
      recipe.steps.length > 0
        ? recipe.steps.map((step) => ({
            instructionText: step.instructionText,
            ingredientRefs: step.ingredientReferences
              .map((uuid) => recipe.ingredients.findIndex((ing) => ing.id === uuid))
              .filter((idx) => idx !== -1)
          }))
        : [{ instructionText: "", ingredientRefs: [] }]
  };
}

export default function EditRecipeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const user = useSessionStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [servings, setServings] = useState("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [tags, setTags] = useState("");
  const [dietaryLabels, setDietaryLabels] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [ingredients, setIngredients] = useState<EditIngredient[]>([
    { name: "", quantity: "", unit: "", note: "" }
  ]);
  const [steps, setSteps] = useState<EditStep[]>([{ instructionText: "", ingredientRefs: [] }]);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);

  const query = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: () => getRecipeById(recipeId!),
    enabled: Boolean(recipeId)
  });

  useEffect(() => {
    if (query.data && !formReady) {
      const state = recipeToFormState(query.data);
      setTitle(state.title);
      setDescription(state.description);
      setCuisine(state.cuisine);
      setServings(state.servings);
      setPrepTimeMinutes(state.prepTimeMinutes);
      setCookTimeMinutes(state.cookTimeMinutes);
      setTags(state.tags);
      setDietaryLabels(state.dietaryLabels);
      setStatus(state.status);
      setIngredients(state.ingredients);
      setSteps(state.steps);
      setCoverUri(query.data.coverImageUrl);
      setFormReady(true);
    }
  }, [query.data, formReady]);

  const saveMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateRecipe>[1]) => updateRecipe(recipeId!, input),
    onSuccess: async (recipe) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] }),
        queryClient.invalidateQueries({ queryKey: ["recipes", user?.id] })
      ]);
      setMessage(`Saved "${recipe.title}".`);
      setTimeout(() => {
        router.back();
      }, 800);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to save recipe.");
    }
  });

  function updateIngredient(index: number, key: keyof EditIngredient, value: string) {
    setIngredients((current) =>
      current.map((ingredient, i) => (i === index ? { ...ingredient, [key]: value } : ingredient))
    );
  }

  function addIngredient() {
    setIngredients((current) => [...current, { name: "", quantity: "", unit: "", note: "" }]);
  }

  function removeIngredient(index: number) {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  function updateStepText(index: number, value: string) {
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, instructionText: value } : step))
    );
  }

  function toggleStepIngredientRef(stepIndex: number, ingredientIndex: number) {
    setSteps((current) =>
      current.map((step, i) => {
        if (i !== stepIndex) return step;
        const refs = step.ingredientRefs.includes(ingredientIndex)
          ? step.ingredientRefs.filter((r) => r !== ingredientIndex)
          : [...step.ingredientRefs, ingredientIndex];
        return { ...step, ingredientRefs: refs };
      })
    );
  }

  function addStep() {
    setSteps((current) => [...current, { instructionText: "", ingredientRefs: [] }]);
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  async function pickCoverPhoto() {
    if (!user?.id) return;
    setCoverUploading(true);
    try {
      const url = await pickAndUploadImage({
        bucket: "recipes",
        path: `${user.id}/covers/${Date.now()}.jpg`
      });
      if (url) {
        setCoverUri(url);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to upload cover photo.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSave() {
    setMessage(null);

    if (!title.trim() || title.trim().length < 2) {
      setMessage("Recipe title must be at least 2 characters.");
      return;
    }

    if (ingredients.filter((ing) => ing.name.trim().length > 0).length === 0) {
      setMessage("Add at least one ingredient.");
      return;
    }

    if (steps.filter((step) => step.instructionText.trim().length > 0).length === 0) {
      setMessage("Add at least one step.");
      return;
    }

    const filteredIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    const fullToFiltered = new Map<number, number>();
    let fi = 0;
    for (let i = 0; i < ingredients.length; i++) {
      if (ingredients[i].name.trim().length > 0) fullToFiltered.set(i, fi++);
    }

    await saveMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
      coverImageUrl: coverUri,
      cuisine: cuisine.trim() || null,
      servings: toOptionalNumber(servings),
      prepTimeMinutes: toOptionalNumber(prepTimeMinutes),
      cookTimeMinutes: toOptionalNumber(cookTimeMinutes),
      tags: splitCsv(tags),
      dietaryLabels: splitCsv(dietaryLabels),
      status,
      ingredients: filteredIngredients,
      steps: steps
        .filter((step) => step.instructionText.trim().length > 0)
        .map((step) => ({
          instructionText: step.instructionText,
          ingredientReferences: step.ingredientRefs
            .map((ref) => fullToFiltered.get(ref))
            .filter((idx): idx is number => idx !== undefined)
            .map(String),
          imageUrl: null
        }))
    });
  }

  if (!recipeId) {
    return (
      <Screen>
        <ErrorState title="Missing recipe ID" description="No recipe identifier was provided." />
      </Screen>
    );
  }

  if (query.isLoading || !formReady) {
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
        <Text style={styles.sectionLabel}>Edit recipe</Text>
        <Text style={styles.title}>{query.data.title}</Text>
      </View>

      <Card>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Recipe basics</Text>
          <Input
            label="Title"
            placeholder="Smoky tomato beans"
            value={title}
            onChangeText={setTitle}
          />
          <Input
            label="Description"
            placeholder="A short note about the dish"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.row}>
            <Input
              label="Cuisine"
              placeholder="Italian"
              containerStyle={styles.flex}
              value={cuisine}
              onChangeText={setCuisine}
            />
            <Input
              label="Servings"
              placeholder="4"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={servings}
              onChangeText={setServings}
            />
          </View>
          <View style={styles.row}>
            <Input
              label="Prep time"
              placeholder="15"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={prepTimeMinutes}
              onChangeText={setPrepTimeMinutes}
            />
            <Input
              label="Cook time"
              placeholder="30"
              keyboardType="numeric"
              containerStyle={styles.flex}
              value={cookTimeMinutes}
              onChangeText={setCookTimeMinutes}
            />
          </View>
          <Input
            label="Tags"
            placeholder="weeknight, spicy, pantry"
            value={tags}
            onChangeText={setTags}
          />
          <Input
            label="Dietary labels"
            placeholder="vegetarian, dairy-free"
            value={dietaryLabels}
            onChangeText={setDietaryLabels}
          />
          <View style={styles.photoRow}>
            <Button
              label={coverUploading ? "Uploading..." : coverUri ? "Change photo" : "Add cover photo"}
              size="sm"
              variant="secondary"
              loading={coverUploading}
              onPress={pickCoverPhoto}
            />
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.photoPreview} resizeMode="cover" />
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
              onPress={addIngredient}
            />
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={`ingredient-${index}`} style={styles.subBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.subBlockTitle}>Ingredient {index + 1}</Text>
                {ingredients.length > 1 ? (
                  <Button
                    label="Remove"
                    size="sm"
                    variant="ghost"
                    onPress={() => removeIngredient(index)}
                  />
                ) : null}
              </View>
              <Input
                label="Name"
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
            <Button label="Add step" size="sm" variant="secondary" onPress={addStep} />
          </View>
          {steps.map((step, stepIndex) => (
            <View key={`step-${stepIndex}`} style={styles.subBlock}>
              <View style={styles.sectionHeader}>
                <Text style={styles.subBlockTitle}>Step {stepIndex + 1}</Text>
                {steps.length > 1 ? (
                  <Button
                    label="Remove"
                    size="sm"
                    variant="ghost"
                    onPress={() => removeStep(stepIndex)}
                  />
                ) : null}
              </View>
              <Input
                label="Instruction"
                placeholder="Warm the oil in a skillet..."
                multiline
                numberOfLines={4}
                value={step.instructionText}
                onChangeText={(value) => updateStepText(stepIndex, value)}
              />
              {ingredients.some((ing) => ing.name.trim().length > 0) ? (
                <View style={styles.tagIngredientSection}>
                  <Text style={styles.tagIngredientLabel}>Tag ingredients</Text>
                  <View style={styles.chips}>
                    {ingredients.map((ingredient, ingredientIndex) => {
                      if (!ingredient.name.trim()) return null;
                      const isActive = step.ingredientRefs.includes(ingredientIndex);
                      return (
                        <Pressable
                          key={`step-${stepIndex}-ing-${ingredientIndex}`}
                          onPress={() => toggleStepIngredientRef(stepIndex, ingredientIndex)}
                          style={[styles.ingredientChip, isActive && styles.ingredientChipActive]}
                        >
                          <Text
                            style={[
                              styles.ingredientChipText,
                              isActive && styles.ingredientChipTextActive
                            ]}
                          >
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
              variant={status === "draft" ? "primary" : "secondary"}
              size="sm"
              onPress={() => setStatus("draft")}
            />
            <Button
              label="Mark published"
              variant={status === "published" ? "primary" : "secondary"}
              size="sm"
              onPress={() => setStatus("published")}
            />
          </View>
          {message ? <Text style={styles.helper}>{message}</Text> : null}
          <Button label="Save changes" loading={saveMutation.isPending} onPress={handleSave} />
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
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700"
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
  subBlockTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
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
