import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV_KEYS } from "@/constants/env";

const supabaseUrl = process.env[ENV_KEYS.supabaseUrl];
const supabaseAnonKey = process.env[ENV_KEYS.supabaseAnonKey];

let cachedClient: SupabaseClient | null = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    throw new Error("Missing Supabase environment variables.");
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    });
  }

  return cachedClient;
}

export const supabase = isSupabaseConfigured ? getSupabaseClient() : null;
