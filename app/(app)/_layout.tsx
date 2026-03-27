import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.line,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8
        }
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={26} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} size={30} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={26} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          )
        }}
      />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="ranking" options={{ href: null }} />
      <Tabs.Screen name="meal-detail" options={{ href: null }} />
      <Tabs.Screen name="recipe-detail" options={{ href: null }} />
      <Tabs.Screen name="edit-recipe" options={{ href: null }} />
      <Tabs.Screen name="comments" options={{ href: null }} />
    </Tabs>
  );
}
