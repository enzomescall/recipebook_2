import { useQuery } from "@tanstack/react-query";

import { getCurrentProfile } from "@/lib/api/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";

export function useCurrentProfile() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: getCurrentProfile,
    enabled: isSupabaseConfigured && status === "authenticated" && Boolean(user?.id),
    staleTime: 30_000
  });
}
