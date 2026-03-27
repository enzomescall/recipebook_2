import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, EmptyState, ErrorState, Input, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { listMeals } from "../../lib/api/meals";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useSessionStore } from "../../store/session";

type SortMode = "rank" | "newest" | "oldest";
type FilterMode = "all" | "public" | "followers" | "private";

export default function LibraryScreen() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("rank");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const userId = user?.id ?? null;
  const mealsQuery = useQuery({
    queryKey: ["meals", userId],
    queryFn: () => listMeals(userId!),
    enabled: isSupabaseConfigured && Boolean(userId)
  });

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Library</Text>
          <Text style={styles.title}>The ranked library is ready once Supabase is configured.</Text>
        </View>
        <EmptyState
          title="Waiting on backend config"
          description="This screen is wired to real meal queries and will populate after the Expo public Supabase env vars are set."
        />
      </Screen>
    );
  }

  if (!userId) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>Library</Text>
          <Text style={styles.title}>Sign in to load your ranked meal history.</Text>
        </View>
        <EmptyState
          title="No active session"
          description="The library reads meals for the authenticated user."
        />
      </Screen>
    );
  }

  if (mealsQuery.isLoading) {
    return (
      <Screen>
        <LoadingState
          title="Loading your rankings"
          description="Pulling meal order from the backend."
        />
      </Screen>
    );
  }

  if (mealsQuery.isError) {
    return (
      <Screen>
        <ErrorState
          title="Couldn't load your library"
          description="There was a problem loading your meals."
          onAction={() => mealsQuery.refetch()}
        />
      </Screen>
    );
  }

  const meals = mealsQuery.data ?? [];

  // 1. Text search
  const normalizedQuery = query.trim().toLowerCase();
  const searchedMeals = meals.filter((meal) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      meal.title.toLowerCase().includes(normalizedQuery) ||
      (meal.caption?.toLowerCase().includes(normalizedQuery) ?? false) ||
      meal.visibility.toLowerCase().includes(normalizedQuery)
    );
  });

  // 2. Visibility filter
  const visibilityFilteredMeals =
    filterMode === "all"
      ? searchedMeals
      : searchedMeals.filter((meal) => meal.visibility === filterMode);

  // 3. Sort (does not mutate rankPosition, only affects display order)
  const filteredMeals = [...visibilityFilteredMeals].sort((a, b) => {
    if (sortMode === "rank") {
      return a.rankPosition - b.rankPosition;
    }
    if (sortMode === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // oldest
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const showResultCount = filteredMeals.length !== meals.length;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Library</Text>
        <Text style={styles.title}>Your ranked meals.</Text>
      </View>

      <Input
        label="Search"
        placeholder="Search meals, captions, visibility"
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.chips}>
        <Button label={`Total ${meals.length}`} size="sm" variant="secondary" />
        <Button
          label="By rank"
          size="sm"
          variant={sortMode === "rank" ? "primary" : "secondary"}
          onPress={() => setSortMode("rank")}
        />
        <Button
          label="Newest"
          size="sm"
          variant={sortMode === "newest" ? "primary" : "secondary"}
          onPress={() => setSortMode("newest")}
        />
        <Button
          label="Oldest"
          size="sm"
          variant={sortMode === "oldest" ? "primary" : "secondary"}
          onPress={() => setSortMode("oldest")}
        />
        <Link href="/ranking" asChild>
          <Button label="Open ranking lab" size="sm" variant="ghost" />
        </Link>
      </View>

      <View style={styles.filterChips}>
        <Button
          label="All"
          size="sm"
          variant={filterMode === "all" ? "primary" : "secondary"}
          onPress={() => setFilterMode("all")}
        />
        <Button
          label="Public"
          size="sm"
          variant={filterMode === "public" ? "primary" : "secondary"}
          onPress={() => setFilterMode("public")}
        />
        <Button
          label="Followers"
          size="sm"
          variant={filterMode === "followers" ? "primary" : "secondary"}
          onPress={() => setFilterMode("followers")}
        />
        <Button
          label="Private"
          size="sm"
          variant={filterMode === "private" ? "primary" : "secondary"}
          onPress={() => setFilterMode("private")}
        />
      </View>

      {showResultCount ? (
        <Text style={styles.resultCount}>
          Showing {filteredMeals.length} of {meals.length}
        </Text>
      ) : null}

      {filteredMeals.length === 0 ? (
        <EmptyState
          title={meals.length === 0 ? "No meals yet" : "No matching meals"}
          description={
            meals.length === 0
              ? "Create your first meal to start building the ranked library."
              : "Try a different search term or filter."
          }
        />
      ) : (
        <View style={styles.list}>
          {filteredMeals.map((meal) => (
            <Card
              key={meal.id}
              interactive
              onPress={() => router.push({ pathname: "/(app)/meal-detail", params: { mealId: meal.id } })}
            >
              <View style={styles.rankRow}>
                <View style={styles.rankBubble}>
                  <Text style={styles.rankText}>{meal.rankPosition}</Text>
                </View>
                <View style={styles.rankCopy}>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <Text style={styles.mealMeta}>{meal.visibility}</Text>
                  {meal.caption ? <Text style={styles.caption}>{meal.caption}</Text> : null}
                </View>
                <Button
                  label="Rerank"
                  size="sm"
                  variant="secondary"
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({ pathname: "/(app)/ranking", params: { subjectMealId: meal.id, mode: "rerank" } });
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl * 1.2
  },
  sectionLabel: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    maxWidth: 340
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  resultCount: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  list: {
    gap: theme.spacing.md
  },
  rankRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  rankBubble: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  rankText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.display,
    fontSize: 18,
    fontWeight: "700"
  },
  rankCopy: {
    flex: 1,
    gap: 2
  },
  mealTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    fontWeight: "700"
  },
  mealMeta: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  caption: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  }
});
