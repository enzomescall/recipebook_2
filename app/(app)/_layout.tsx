import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
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
        <LoadingState title="Loading" description="Setting up your kitchen." />
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
        tabBarStyle: styles.tabBar
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.createBtn}>
              <Ionicons name="add" size={26} color={theme.colors.white} />
            </View>
          )
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={24} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 60,
    paddingTop: 6,
    paddingBottom: 6
  },
  createBtn: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  }
});
