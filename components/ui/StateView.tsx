import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";

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
      <View style={styles.stateRow}>
        <ActivityIndicator color={theme.colors.accent} />
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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>0</Text>
        </View>
        <Text style={styles.stateTitle}>{title}</Text>
        {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
        {footer}
      </View>
    </Card>
  );
}

export function ErrorState({ title, description, actionLabel = "Try again", onAction, footer }: StateProps) {
  return (
    <Card>
      <View style={styles.stateStack}>
        <View style={[styles.badge, styles.errorBadge]}>
          <Text style={[styles.badgeText, styles.errorBadgeText]}>!</Text>
        </View>
        <Text style={styles.stateTitle}>{title}</Text>
        {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
        {onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
        {footer}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  stateStack: {
    alignItems: "flex-start",
    gap: theme.spacing.sm
  },
  stateCopy: {
    flex: 1,
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
  badge: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  errorBadge: {
    backgroundColor: theme.colors.accentSoft
  },
  badgeText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: "700"
  },
  errorBadgeText: {
    color: theme.colors.danger
  }
});
