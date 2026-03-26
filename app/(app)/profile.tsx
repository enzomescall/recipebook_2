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
  const isConfigured = isSupabaseConfigured;
  const hasProfileWarning = isConfigured && profileQuery.isError;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isHydrated || (isConfigured && status === "loading")) {
    return (
      <Screen>
        <LoadingState
          title="Loading profile"
          description="Checking your session and pulling your saved profile details."
        />
      </Screen>
    );
  }

  if (!isConfigured) {
    return (
      <Screen>
        <View style={styles.header}>
          <Avatar name={viewModel.avatarSeed} size={72} />
          <View style={styles.identity}>
            <Text style={styles.name}>{viewModel.name}</Text>
            <Text style={styles.handle}>{viewModel.handle}</Text>
            <Text style={styles.bio}>{viewModel.bio}</Text>
          </View>
        </View>

        <Card>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Supabase is not configured</Text>
            <Text style={styles.bannerCopy}>
              Add the Expo public Supabase env vars to load your real profile and sign-out flow.
            </Text>
          </View>
        </Card>

        <StatsRow followers={viewModel.followersCount} following={viewModel.followingCount} meals={viewModel.mealsCount} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={viewModel.avatarSeed} size={72} />
        <View style={styles.identity}>
          <Text style={styles.name}>{viewModel.name}</Text>
          <Text style={styles.handle}>{viewModel.handle}</Text>
          <Text style={styles.bio}>{viewModel.bio}</Text>
        </View>
      </View>

      <StatsRow followers={viewModel.followersCount} following={viewModel.followingCount} meals={viewModel.mealsCount} />

      {hasProfileWarning ? (
        <ErrorState
          title="Profile record needs attention"
          description="We could not load the saved profile row, so we're showing your authenticated session details for now."
          actionLabel="Retry"
          onAction={() => {
            profileQuery.refetch();
          }}
        />
      ) : null}

      <Card>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Account</Text>
          <InfoRow label="Email" value={viewModel.email} />
          <InfoRow label="Username" value={viewModel.handle} />
          <InfoRow label="Followers" value={String(viewModel.followersCount)} />
          <InfoRow label="Following" value={String(viewModel.followingCount)} />
        </View>
      </Card>

      <Card>
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Profile actions</Text>
          <Button label="Edit profile" variant="secondary" onPress={() => router.push("/edit-profile")} />
          <Button
            label="Sign out"
            variant="danger"
            loading={isSigningOut}
            onPress={handleSignOut}
          />
        </View>
      </Card>
    </Screen>
  );
}

function StatsRow({
  followers,
  following,
  meals
}: {
  followers: number;
  following: number;
  meals: string;
}) {
  return (
    <View style={styles.statsRow}>
      <Card style={styles.statCard}>
        <Text style={styles.statValue}>{meals}</Text>
        <Text style={styles.statLabel}>Meals</Text>
      </Card>
      <Card style={styles.statCard}>
        <Text style={styles.statValue}>{followers}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </Card>
      <Card style={styles.statCard}>
        <Text style={styles.statValue}>{following}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </Card>
    </View>
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
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl * 1.1
  },
  identity: {
    alignItems: "center",
    gap: theme.spacing.xs
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    fontWeight: "700"
  },
  handle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14
  },
  bio: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320
  },
  banner: {
    gap: theme.spacing.xs
  },
  bannerTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    fontWeight: "700"
  },
  bannerCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  statCard: {
    flex: 1
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 22,
    fontWeight: "700"
  },
  statLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  block: {
    gap: theme.spacing.sm
  },
  blockTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    fontWeight: "700"
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md
  },
  infoLabel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  infoValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1
  }
});
