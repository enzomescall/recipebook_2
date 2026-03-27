import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../constants/theme";

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Saved</Text>
      </View>
      <View style={styles.empty}>
        <Ionicons name="bookmark-outline" size={36} color={theme.colors.line} />
        <Text style={styles.emptyTitle}>Nothing saved yet</Text>
        <Text style={styles.emptyText}>Bookmark meals from your feed to find them here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },
  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  pageTitle: {
    ...theme.type.hero,
    color: theme.colors.text
  },
  empty: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: "center",
    paddingBottom: theme.spacing.xxl
  },
  emptyTitle: {
    ...theme.type.title,
    color: theme.colors.text,
    fontSize: 18
  },
  emptyText: {
    ...theme.type.body,
    color: theme.colors.muted,
    maxWidth: 240,
    textAlign: "center"
  }
});
