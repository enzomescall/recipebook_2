import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PressableProps & {
  children?: ReactNode;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? theme.colors.white : theme.colors.accent} />
      ) : (
        <Text style={[styles.label, labelStyles[variant], sizeLabelStyles[size]]}>
          {children ?? label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    justifyContent: "center"
  },
  fullWidth: { width: "100%" },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
  label: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15
  }
});

const sizeStyles = StyleSheet.create({
  sm: { minHeight: 34, paddingHorizontal: theme.spacing.md },
  md: { minHeight: 44, paddingHorizontal: theme.spacing.lg },
  lg: { minHeight: 52, paddingHorizontal: theme.spacing.xl }
});

const sizeLabelStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 }
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: theme.colors.accent },
  secondary: { backgroundColor: theme.colors.surfaceStrong },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: theme.colors.danger }
});

const labelStyles = StyleSheet.create({
  primary: { color: theme.colors.white },
  secondary: { color: theme.colors.text },
  ghost: { color: theme.colors.text },
  danger: { color: theme.colors.white }
});
