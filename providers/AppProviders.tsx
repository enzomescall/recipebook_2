import { PropsWithChildren, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSessionStore } from "@/store/session";

const queryClient = new QueryClient();

function AuthBootstrap() {
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void setSession(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [setSession]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      {children}
    </QueryClientProvider>
  );
}
