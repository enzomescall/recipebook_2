import { ReactNode } from "react";
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "../../constants/theme";

type CardProps = PressableProps & {
  children: ReactNode;
  interactive?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, interactive = false, padded = true, contentStyle, style, ...props }: CardProps) {
  const inner = <View style={[padded && styles.padded, contentStyle]}>{children}</View>;

  if (interactive) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card
  },
  padded: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  pressed: {
    transform: [{ scale: 0.985 }]
  }
});
