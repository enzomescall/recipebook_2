import type { PostgrestError } from "@supabase/supabase-js";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function mapSupabaseError(error: PostgrestError | null, fallbackMessage: string) {
  if (!error) {
    return;
  }

  throw new ApiError(error.message || fallbackMessage, error);
}
