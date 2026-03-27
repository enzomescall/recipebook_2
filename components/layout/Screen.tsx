import { ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { theme } from "../../constants/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  scrollProps
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.orbTop} />
      <View pointerEvents="none" style={styles.orbBottom} />
      {scroll ? (
        <ScrollView
          {...scrollProps}
          contentContainerStyle={[styles.content, contentStyle]}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg
  },
  orbTop: {
    position: "absolute",
    top: -60,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.55
  },
  orbBottom: {
    position: "absolute",
    left: -90,
    bottom: -60,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: theme.colors.surfaceStrong,
    opacity: 0.6
  }
});
