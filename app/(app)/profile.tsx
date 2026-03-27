import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Avatar, Button, Card, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { buildProfileViewModel, useCurrentProfile } from "../../features/profile";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function ProfileScreen() {
  const status = useSessionStore((state) => state.status);
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const sessionUser = useSessionStore((state) => state.user);
  const signOut = useSessionStore((state) => state.signOut);
  const profileQuery = useCurrentProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profile = profileQuery.data ?? null;
  const viewModel = buildProfileViewModel(profile, sessionUser);
  const hasProfileWarning = isSupabaseConfigured && profileQuery.isError;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isHydrated || (isSupabaseConfigured && status === "loading")) {
    return (
      <Screen>
        <LoadingState title="Loading profile" />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar name={viewModel.avatarSeed} uri={viewModel.avatarUrl} size={80} />
        <Text style={styles.name}>{viewModel.name}</Text>
        <Text style={styles.handle}>{viewModel.handle}</Text>
        {viewModel.bio ? <Text style={styles.bio}>{viewModel.bio}</Text> : null}
      </View>

      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{viewModel.mealsCount}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{viewModel.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{viewModel.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </Card>

      {hasProfileWarning ? (
        <ErrorState
          title="Couldn't load profile"
          description="Showing session details instead."
          actionLabel="Retry"
          onAction={() => profileQuery.refetch()}
        />
      ) : null}

      {!isSupabaseConfigured ? (
        <Card>
          <Text style={styles.bannerTitle}>Supabase not configured</Text>
          <Text style={styles.bannerText}>Add environment variables to load your real profile.</Text>
        </Card>
      ) : null}

      {/* Account info */}
      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <InfoRow label="Email" value={viewModel.email} />
        <InfoRow label="Username" value={viewModel.handle} />
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button label="Edit profile" variant="secondary" fullWidth onPress={() => router.push("/edit-profile")} />
        <Button label="Sign out" variant="danger" fullWidth loading={isSigningOut} onPress={handleSignOut} />
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xxl
  },
  name: {
    ...theme.type.hero,
    color: theme.colors.text,
    fontSize: 28
  },
  handle: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  bio: {
    ...theme.type.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 300
  },

  // Stats
  statsRow: {
    flexDirection: "row"
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 2
  },
  divider: {
    backgroundColor: theme.colors.line,
    width: 1
  },
  statNum: {
    ...theme.type.title,
    color: theme.colors.text,
    fontSize: 22
  },
  statLabel: {
    ...theme.type.caption,
    color: theme.colors.muted
  },

  // Banner
  bannerTitle: {
    ...theme.type.bodyMedium,
    color: theme.colors.text
  },
  bannerText: {
    ...theme.type.body,
    color: theme.colors.muted
  },

  // Account
  sectionTitle: {
    ...theme.type.label,
    color: theme.colors.text,
    fontSize: 15
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  infoLabel: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  infoValue: {
    ...theme.type.bodyMedium,
    color: theme.colors.text,
    textAlign: "right",
    flexShrink: 1
  },

  // Actions
  actions: {
    gap: theme.spacing.sm
  }
});
