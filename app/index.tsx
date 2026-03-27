import { Link, Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card } from "../components/ui";
import { Screen } from "../components/layout";
import { theme } from "../constants/theme";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { useSessionStore } from "../store/session";

const pillars = [
  {
    title: "Structure recipes cleanly",
    copy: "Ingredients, steps, images, and metadata stay organized from the first draft."
  },
  {
    title: "Rank meals by comparison",
    copy: "Pairwise choices keep the ranking flow simple, deterministic, and scalable."
  },
  {
    title: "Ship social surfaces later",
    copy: "Feed, comments, follows, and notifications plug into the same core model."
  }
];

export default function LandingScreen() {
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const status = useSessionStore((state) => state.status);

  if (isSupabaseConfigured && isHydrated && status === "authenticated") {
    return <Redirect href="/feed" />;
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>Recipebook</Text>
        </View>
        <Text style={styles.title}>Make cooking feel organized, ranked, and social.</Text>
        <Text style={styles.subtitle}>
          A clean mobile foundation for recipes, meals, ranking, and sharing without hardcoding the product into the UI.
        </Text>
        {!isSupabaseConfigured ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to enable real auth and data flows.
            </Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Link href="/sign-up" asChild>
            <Button label="Create account" />
          </Link>
          <Link href="/sign-in" asChild>
            <Button label="Sign in" variant="secondary" />
          </Link>
        </View>
      </View>

      <View style={styles.preview}>
        {pillars.map((pillar) => (
          <Card key={pillar.title} style={styles.previewCard}>
            <Text style={styles.previewTitle}>{pillar.title}</Text>
            <Text style={styles.previewCopy}>{pillar.copy}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.footerCard}>
        <Text style={styles.footerTitle}>Foundation first</Text>
        <Text style={styles.footerCopy}>
          The app shell, shared primitives, and theme tokens are ready to support the first set of product flows.
        </Text>
        <Link href="/feed" asChild>
          <Button label="Open app preview" variant="ghost" />
        </Link>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl * 1.5
  },
  brandPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  brandPillText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 38,
    lineHeight: 42,
    maxWidth: 340
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360
  },
  notice: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md
  },
  noticeText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 20
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  preview: {
    gap: theme.spacing.md
  },
  previewCard: {
    gap: theme.spacing.xs
  },
  previewTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.sansBold,
    fontSize: 16
  },
  previewCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  footerCard: {
    gap: theme.spacing.sm
  },
  footerTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 20
  },
  footerCopy: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  }
});
