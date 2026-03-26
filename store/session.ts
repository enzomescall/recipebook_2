import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { ensureProfileForUser } from "@/lib/api/profiles";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthStatus = "loading" | "authenticated" | "signed_out";

type SessionState = {
  status: AuthStatus;
  isHydrated: boolean;
  session: Session | null;
  user: User | null;
  errorMessage: string | null;
  hydrateSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  setSession: (session: Session | null) => Promise<void>;
  clearError: () => void;
};

function deriveStatus(session: Session | null): AuthStatus {
  return session?.user ? "authenticated" : "signed_out";
}

async function syncProfileForUser(user: User | null) {
  if (!user || !isSupabaseConfigured) {
    return;
  }

  await ensureProfileForUser(user);
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  isHydrated: false,
  session: null,
  user: null,
  errorMessage: null,
  async hydrateSession() {
    if (!isSupabaseConfigured) {
      set({
        status: "signed_out",
        isHydrated: true,
        session: null,
        user: null,
        errorMessage: null
      });
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    const session = data.session;

    try {
      await syncProfileForUser(session?.user ?? null);
    } catch (profileError) {
      set({
        errorMessage: profileError instanceof Error ? profileError.message : "Failed to sync profile."
      });
    }

    set({
      status: deriveStatus(session),
      isHydrated: true,
      session,
      user: session?.user ?? null,
      errorMessage: error?.message ?? null
    });
  },
  async signIn(email, password) {
    const supabase = getSupabaseClient();
    set({ status: "loading", errorMessage: null });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ status: "signed_out", errorMessage: error.message });
      throw error;
    }

    await syncProfileForUser(data.session?.user ?? null);

    set({
      status: deriveStatus(data.session),
      session: data.session,
      user: data.session?.user ?? null,
      errorMessage: null
    });
  },
  async signUp({ email, password, username, displayName }) {
    const supabase = getSupabaseClient();
    set({ status: "loading", errorMessage: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName
        }
      }
    });

    if (error) {
      set({ status: "signed_out", errorMessage: error.message });
      throw error;
    }

    await syncProfileForUser(data.session?.user ?? null);

    set({
      status: deriveStatus(data.session),
      session: data.session,
      user: data.user,
      errorMessage: null
    });
  },
  async signOut() {
    if (!isSupabaseConfigured) {
      set({
        status: "signed_out",
        session: null,
        user: null,
        errorMessage: null
      });
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ errorMessage: error.message });
      throw error;
    }

    set({
      status: "signed_out",
      session: null,
      user: null,
      errorMessage: null
    });
  },
  async requestPasswordReset(email) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      set({ errorMessage: error.message });
      throw error;
    }

    set({ errorMessage: null });
  },
  async setSession(session) {
    try {
      await syncProfileForUser(session?.user ?? null);
    } catch (profileError) {
      set({
        errorMessage: profileError instanceof Error ? profileError.message : "Failed to sync profile."
      });
    }

    set({
      status: deriveStatus(session),
      session,
      user: session?.user ?? null,
      errorMessage: null,
      isHydrated: true
    });
  },
  clearError() {
    set({ errorMessage: null });
  }
}));
