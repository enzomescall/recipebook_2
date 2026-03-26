import { Redirect, Stack } from "expo-router";

import { LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function AuthLayout() {
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const status = useSessionStore((state) => state.status);

  if (isSupabaseConfigured && !isHydrated) {
    return (
      <Screen>
        <LoadingState
          title="Checking your session"
          description="Getting the auth state ready before we show the next screen."
        />
      </Screen>
    );
  }

  if (isSupabaseConfigured && status === "authenticated") {
    return <Redirect href="/feed" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.canvas
        }
      }}
    />
  );
}
