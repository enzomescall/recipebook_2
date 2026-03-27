import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "../../components/layout";
import { Avatar, Button, Card, ErrorState, Input, LoadingState } from "../../components/ui";
import { theme } from "../../constants/theme";
import { buildProfileViewModel, profileFormSchema, useCurrentProfile, type ProfileFormValues } from "../../features/profile";
import { updateCurrentProfile } from "../../lib/api/profiles";
import { pickImage, uploadImage } from "../../lib/upload";
import { useSessionStore } from "../../store/session";

function buildInitialValues(viewModel: ReturnType<typeof buildProfileViewModel>, profileImageUrl?: string | null): ProfileFormValues {
  return {
    displayName: viewModel.name,
    username: viewModel.handle.replace(/^@/, ""),
    bio: viewModel.bio,
    profileImageUrl: profileImageUrl ?? ""
  };
}

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const sessionUser = useSessionStore((state) => state.user);
  const profileQuery = useCurrentProfile();
  const profile = profileQuery.data ?? null;
  const viewModel = buildProfileViewModel(profile, sessionUser);
  const initialDisplayName =
    profile?.displayName ?? sessionUser?.user_metadata?.display_name ?? sessionUser?.user_metadata?.full_name ?? "Recipebook";
  const initialUsername = profile?.username ?? sessionUser?.user_metadata?.username ?? sessionUser?.email?.split("@")[0] ?? "recipebook";
  const initialBio =
    profile?.bio ?? sessionUser?.user_metadata?.bio ?? "A place to organize recipes, meals, rankings, and the social side of cooking.";
  const initialProfileImageUrl = profile?.profileImageUrl ?? "";

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: initialDisplayName,
      username: initialUsername,
      bio: initialBio,
      profileImageUrl: initialProfileImageUrl
    }
  });

  useEffect(() => {
    reset({
      displayName: initialDisplayName,
      username: initialUsername,
      bio: initialBio,
      profileImageUrl: initialProfileImageUrl
    });
  }, [
    initialBio,
    initialDisplayName,
    initialProfileImageUrl,
    initialUsername,
    reset,
  ]);

  const mutation = useMutation({
    mutationFn: updateCurrentProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["current-profile", sessionUser?.id] });
      router.back();
    }
  });

  const savedAvatarUrl = watch("profileImageUrl");
  const avatarUrl = localPreviewUri ?? (savedAvatarUrl || undefined);

  async function handleChangePhoto() {
    if (!sessionUser?.id) return;
    setUploadError(null);

    const uri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (!uri) return;

    // Show local preview immediately while uploading
    setLocalPreviewUri(uri);
    setIsUploading(true);

    try {
      const publicUrl = await uploadImage({
        bucket: "profiles",
        path: `${sessionUser.id}/avatar.jpg`,
        uri
      });
      setValue("profileImageUrl", publicUrl, { shouldValidate: true });
      setLocalPreviewUri(null); // remote URL is now in the form, drop the local blob
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      // keep localPreviewUri so the user can still see what they picked
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    await mutation.mutateAsync({
      displayName: values.displayName,
      username: values.username,
      bio: values.bio.trim() || null,
      profileImageUrl: values.profileImageUrl.trim() || null
    });
  }

  if (profileQuery.isLoading && !profile) {
    return (
      <Screen>
        <LoadingState
          title="Loading profile editor"
          description="Pulling your saved profile details so we can prefill the form."
        />
      </Screen>
    );
  }

  if (profileQuery.isError && !profile) {
    return (
      <Screen>
        <ErrorState
          title="Couldn't load profile details"
          description="We hit a problem preparing the editor."
          actionLabel="Retry"
          onAction={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>Edit the public details people see when they find your meals.</Text>
      </View>

      <Card>
        <View style={styles.avatarBlock}>
          <Avatar
            name={watch("displayName") || viewModel.name}
            uri={avatarUrl}
            size={84}
          />
          <Button
            label={isUploading ? "Uploading..." : "Change photo"}
            variant="secondary"
            size="sm"
            loading={isUploading}
            disabled={isUploading}
            onPress={handleChangePhoto}
          />
          {uploadError ? <Text style={styles.uploadError}>{uploadError}</Text> : null}
        </View>
      </Card>

      <Card>
        <View style={styles.form}>
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Display name"
                placeholder="Alex"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.displayName?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="username"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Username"
                placeholder="alexcooks"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.username?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="bio"
            render={({ field: { onBlur, onChange, value } }) => (
              <Input
                label="Bio"
                placeholder="Tell people what you love to cook."
                multiline
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.bio?.message}
              />
            )}
          />
          {mutation.error ? <Text style={styles.error}>{mutation.error.message}</Text> : null}
          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
            <Button label="Save profile" loading={mutation.isPending} onPress={handleSubmit(onSubmit)} />
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl * 1.2
  },
  eyebrow: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 30,
    lineHeight: 36
  },
  avatarBlock: {
    alignItems: "center",
    gap: theme.spacing.sm
  },
  form: {
    gap: theme.spacing.md
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "flex-end"
  },
  error: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  uploadError: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    textAlign: "center"
  }
});
