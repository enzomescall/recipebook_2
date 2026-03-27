import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, ErrorState, Input, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { getMealById, updateMeal } from "../../lib/api/meals";
import { pickAndUploadImage } from "../../lib/upload";
import { useSessionStore } from "../../store/session";
import type { Meal } from "../../types/domain";

type VisibilityOption = Meal["visibility"];
const VISIBILITY_OPTIONS: VisibilityOption[] = ["public", "followers", "private"];

export default function EditMealScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const currentUser = useSessionStore((state) => state.user);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<VisibilityOption>("public");
  const [heroUri, setHeroUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["meal", mealId],
    queryFn: () => getMealById(mealId!),
    enabled: Boolean(mealId)
  });

  useEffect(() => {
    if (query.data) {
      const { meal } = query.data;
      setTitle(meal.title);
      setCaption(meal.caption ?? "");
      setVisibility(meal.visibility as VisibilityOption);
      setHeroUri(meal.heroImageUrl ?? null);
    }
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMeal(mealId!, {
        title: title.trim(),
        caption: caption.trim() || undefined,
        heroImageUrl: heroUri ?? undefined,
        visibility
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meal", mealId] });
      await queryClient.invalidateQueries({ queryKey: ["meals"] });
      router.back();
    },
    onError: (err) => {
      setMessage(err instanceof Error ? err.message : "Failed to save changes.");
    }
  });

  async function pickPhoto() {
    if (!currentUser) return;
    setUploading(true);
    try {
      const url = await pickAndUploadImage({
        bucket: "meals",
        path: `${currentUser.id}/heroes/${Date.now()}.jpg`
      });
      if (url) setHeroUri(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  if (!mealId) {
    return <Screen><ErrorState title="Missing meal ID" /></Screen>;
  }

  if (query.isLoading) {
    return <Screen><LoadingState title="Loading meal" /></Screen>;
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

  const isOwner = currentUser?.id === query.data.meal.ownerId;
  if (!isOwner) {
    return <Screen><ErrorState title="Not authorized" description="You can only edit your own meals." /></Screen>;
  }

  const canSave = title.trim().length > 0 && !uploading;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Edit meal</Text>
      </View>

      <Card>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What did you make?"
        />
        <Input
          label="Caption"
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a note (optional)"
          multiline
          numberOfLines={3}
        />
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>Visibility</Text>
        <View style={styles.visibilityRow}>
          {VISIBILITY_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              style={[styles.visibilityChip, visibility === opt && styles.visibilityChipActive]}
              onPress={() => setVisibility(opt)}
            >
              <Text style={[styles.visibilityChipText, visibility === opt && styles.visibilityChipTextActive]}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.fieldLabel}>Photo</Text>
        <Pressable style={styles.photoArea} onPress={pickPhoto} disabled={uploading}>
          {heroUri ? (
            <Image source={{ uri: heroUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={theme.colors.muted} />
              <Text style={styles.photoPlaceholderText}>
                {uploading ? "Uploading…" : "Tap to choose photo"}
              </Text>
            </View>
          )}
          {heroUri ? (
            <View style={styles.changePhotoOverlay}>
              <Ionicons name="camera-outline" size={18} color={theme.colors.white} />
              <Text style={styles.changePhotoText}>{uploading ? "Uploading…" : "Change"}</Text>
            </View>
          ) : null}
        </Pressable>
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.actions}>
        <Button
          label="Save changes"
          fullWidth
          loading={saveMutation.isPending}
          disabled={!canSave}
          onPress={() => saveMutation.mutate()}
        />
        <Button
          label="Cancel"
          fullWidth
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xl * 1.2
  },
  backButton: { alignSelf: "flex-start" },
  backLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 15
  },
  pageTitle: {
    ...theme.type.hero,
    color: theme.colors.text
  },
  fieldLabel: {
    ...theme.type.label,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs
  },
  visibilityRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  visibilityChip: {
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  visibilityChipActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  visibilityChipText: {
    ...theme.type.label,
    color: theme.colors.muted
  },
  visibilityChipTextActive: {
    color: theme.colors.accent
  },
  photoArea: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    position: "relative"
  },
  photoPreview: {
    borderRadius: theme.radius.md,
    height: 200,
    width: "100%"
  },
  photoPlaceholder: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
    height: 140,
    justifyContent: "center"
  },
  photoPlaceholderText: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  changePhotoOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    bottom: 0,
    flexDirection: "row",
    gap: theme.spacing.xxs,
    justifyContent: "center",
    left: 0,
    paddingVertical: theme.spacing.xs,
    position: "absolute",
    right: 0
  },
  changePhotoText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.sansBold,
    fontSize: 13
  },
  message: {
    ...theme.type.body,
    color: theme.colors.muted,
    textAlign: "center"
  },
  actions: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md
  }
});
