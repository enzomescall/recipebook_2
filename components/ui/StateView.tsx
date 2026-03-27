import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./Button";
import { theme } from "../../constants/theme";

type StateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  footer?: ReactNode;
};

export function LoadingState({ title, description }: StateProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, footer }: StateProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Ionicons name="restaurant-outline" size={24} color={theme.colors.muted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
      {footer}
    </View>
  );
}

export function ErrorState({ title, description, actionLabel = "Try again", onAction, footer }: StateProps) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconWrap, styles.errorIcon]}>
        <Ionicons name="warning-outline" size={24} color={theme.colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.xl,
    height: 48,
    justifyContent: "center",
    width: 48,
    marginBottom: theme.spacing.xs
  },
  errorIcon: {
    backgroundColor: theme.colors.accentSoft
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
    textAlign: "center"
  },
  description: {
    ...theme.type.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 280
  }
});
