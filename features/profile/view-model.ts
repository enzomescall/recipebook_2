import type { User } from "@supabase/supabase-js";

import type { UserProfile } from "@/types/domain";

export type ProfileViewModel = {
  name: string;
  handle: string;
  bio: string;
  avatarSeed: string;
  followersCount: number;
  followingCount: number;
  mealsCount: string;
  email: string;
};

function formatHandle(value: string | null | undefined) {
  if (!value) {
    return "@recipebook";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

export function buildProfileViewModel(profile: UserProfile | null, user: User | null): ProfileViewModel {
  const displayName = profile?.displayName ?? user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? "Recipebook";
  const username = profile?.username ?? user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "recipebook";
  const bio = profile?.bio ?? user?.user_metadata?.bio ?? "A place to organize recipes, meals, rankings, and the social side of cooking.";

  return {
    name: displayName,
    handle: formatHandle(username),
    bio,
    avatarSeed: displayName,
    followersCount: profile?.followersCount ?? 0,
    followingCount: profile?.followingCount ?? 0,
    mealsCount: "0",
    email: user?.email ?? "No email on file"
  };
}
