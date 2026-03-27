import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./Button";
import { Card } from "./Card";
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
    <Card>
      <View style={styles.stateStack}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <View style={styles.stateCopy}>
          <Text style={styles.stateTitle}>{title}</Text>
          {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, footer }: StateProps) {
  return (
    <Card>
      <View style={styles.stateStack}>
        <View style={styles.iconWrap}>
          <Ionicons name="restaurant-outline" size={28} color={theme.colors.muted} />
        </View>
        <Text style={styles.stateTitle}>{title}</Text>
        {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
        {footer}
      </View>
    </Card>
  );
}

export function ErrorState({ title, description, actionLabel = "Try again", onAction, footer }: StateProps) {
  return (
    <Card>
      <View style={styles.stateStack}>
        <View style={[styles.iconWrap, styles.errorIconWrap]}>
          <Ionicons name="warning-outline" size={28} color={theme.colors.danger} />
        </View>
        <Text style={styles.stateTitle}>{title}</Text>
        {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
        {onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" /> : null}
        {footer}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stateStack: {
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  stateCopy: {
    gap: theme.spacing.xs
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: "700"
  },
  stateDescription: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.md,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  errorIconWrap: {
    backgroundColor: theme.colors.accentSoft
  }
});
