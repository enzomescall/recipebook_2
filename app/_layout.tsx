import { Stack } from "expo-router";
import { StatusBar } from "react-native";

import { theme } from "../constants/theme";
import { AppProviders } from "../providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.canvas} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.canvas
          }
        }}
      />
    </AppProviders>
  );
}
