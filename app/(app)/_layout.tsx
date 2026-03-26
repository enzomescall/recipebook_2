import { Redirect, Tabs } from "expo-router";

import { LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

export default function AppLayout() {
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const status = useSessionStore((state) => state.status);

  if (isSupabaseConfigured && !isHydrated) {
    return (
      <Screen>
        <LoadingState
          title="Loading your kitchen"
          description="Preparing auth and the shared app shell."
        />
      </Screen>
    );
  }

  if (isSupabaseConfigured && status !== "authenticated") {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      initialRouteName="feed"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.line,
          height: 60,
          paddingTop: 6,
          paddingBottom: 6
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body,
          fontSize: 11,
          fontWeight: "700"
        }
      }}
    >
      <Tabs.Screen name="feed" options={{ title: "Feed" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="create" options={{ title: "Create" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="ranking" options={{ href: null }} />
      <Tabs.Screen name="meal-detail" options={{ href: null }} />
      <Tabs.Screen name="recipe-detail" options={{ href: null }} />
      <Tabs.Screen name="edit-recipe" options={{ href: null }} />
      <Tabs.Screen name="comments" options={{ href: null }} />
    </Tabs>
  );
}
