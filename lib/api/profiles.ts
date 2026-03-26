import type { User } from "@supabase/supabase-js";

import { mapSupabaseError } from "@/lib/api/shared";
import { toUserProfile } from "@/lib/api/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";
import type { UserProfile } from "@/types/domain";

type ProfileDraft = Pick<UserProfile, "username" | "displayName" | "bio" | "profileImageUrl">;

function sanitizeUsername(value: string | null | undefined) {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || null;
}

function buildFallbackUsername(user: User) {
  const emailSeed = sanitizeUsername(user.email?.split("@")[0]);
  const metadataSeed = sanitizeUsername(user.user_metadata?.username);
  const base = metadataSeed ?? emailSeed ?? "cook";

  return `${base}_${user.id.slice(0, 6)}`;
}

function buildProfileDraft(user: User, overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  const metadata = user.user_metadata ?? {};
  const fallbackDisplayName = user.email?.split("@")[0] ?? "Recipebook";

  return {
    username:
      sanitizeUsername(overrides.username) ??
      sanitizeUsername(metadata.username) ??
      sanitizeUsername(user.email?.split("@")[0]) ??
      buildFallbackUsername(user),
    displayName:
      overrides.displayName?.trim() ||
      metadata.display_name ||
      metadata.full_name ||
      fallbackDisplayName,
    bio: overrides.bio?.trim() || metadata.bio || null,
    profileImageUrl: overrides.profileImageUrl?.trim() || metadata.profile_image_url || metadata.avatar_url || null
  };
}

async function fetchProfileRow(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle<ProfileRow>();

  mapSupabaseError(error, "Failed to load profile.");
  return data;
}

export async function getCurrentProfile() {
  const supabase = getSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    throw new Error("No authenticated user.");
  }

  const data = await fetchProfileRow(userId);
  if (!data) {
    throw new Error("Profile not found.");
  }
  return toUserProfile(data);
}

export async function ensureProfileForUser(user: User, overrides: Partial<ProfileDraft> = {}) {
  const existingProfile = await fetchProfileRow(user.id);
  if (existingProfile) {
    return toUserProfile(existingProfile);
  }

  const supabase = getSupabaseClient();
  const draft = buildProfileDraft(user, overrides);

  const insertProfile = async (username: string) =>
    supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        display_name: draft.displayName,
        bio: draft.bio,
        profile_image_url: draft.profileImageUrl
      })
      .select("*")
      .single<ProfileRow>();

  let { data, error } = await insertProfile(draft.username);

  if (error?.code === "23505") {
    // Could be a PK conflict (profile created concurrently) or a username conflict.
    // Check for the profile first before retrying with a fallback username.
    const existing = await fetchProfileRow(user.id);
    if (existing) return toUserProfile(existing);
    ({ data, error } = await insertProfile(buildFallbackUsername(user)));
  }

  mapSupabaseError(error, "Failed to create profile.");
  if (!data) {
    throw new Error("Failed to create profile.");
  }

  return toUserProfile(data);
}

export async function ensureCurrentProfile(overrides: Partial<ProfileDraft> = {}) {
  const supabase = getSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  return ensureProfileForUser(user, overrides);
}

export async function updateCurrentProfile(profile: ProfileDraft) {
  const supabase = getSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  const draft = buildProfileDraft(user, profile);
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: draft.username,
        display_name: draft.displayName,
        bio: draft.bio,
        profile_image_url: draft.profileImageUrl
      },
      { onConflict: "id" }
    )
    .select("*")
    .single<ProfileRow>();

  mapSupabaseError(error, "Failed to update profile.");
  if (!data) {
    throw new Error("Failed to update profile.");
  }
  return toUserProfile(data);
}
