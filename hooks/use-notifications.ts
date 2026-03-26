import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNotificationsForUser, markNotificationRead } from "@/lib/api/notifications";
import type { RichNotification } from "@/lib/api/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";

export type { RichNotification };

export function useNotifications() {
  const queryClient = useQueryClient();
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  const query = useQuery<RichNotification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotificationsForUser(user!.id),
    enabled: isSupabaseConfigured && status === "authenticated" && Boolean(user?.id),
    staleTime: 15_000
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    }
  });

  return {
    ...query,
    markRead: markRead.mutateAsync,
    isMarkingRead: markRead.isPending
  };
}
