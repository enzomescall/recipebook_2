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

export function Screen({ children, scroll = true, contentStyle, scrollProps }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
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
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },
  scroll: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg
  },
  fill: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg
  }
});
