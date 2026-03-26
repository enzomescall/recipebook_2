import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { theme } from "../../constants/theme";

type CardProps = PressableProps & {
  children: ReactNode;
  interactive?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  interactive = false,
  contentStyle,
  style,
  ...props
}: CardProps) {
  if (interactive) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    ...theme.shadow.card
  },
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  }
});
