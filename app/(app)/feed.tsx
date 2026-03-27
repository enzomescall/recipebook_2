import { useRef, useState } from "react";
import {
  FlatList,
  GestureResponderEvent,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Avatar, EmptyState, ErrorState, LoadingState, MealPhoto } from "../../components/ui";
import { theme } from "../../constants/theme";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useFeed } from "../../hooks/use-feed";
import { formatRelativeTime } from "../../features/feed/format";
import { toggleMealLike, toggleStarredMeal } from "../../lib/api/social";
import { createMealLikeNotification } from "../../lib/api/notifications";
import { useSessionStore } from "../../store/session";
import type { User } from "@supabase/supabase-js";

import type { FeedItem } from "../../features/feed/types";

type SearchMode = "meals" | "recipes" | "users";

export default function FeedScreen() {
  const router = useRouter();
  const feed = useFeed();
  const currentUser = useSessionStore((state) => state.user);
  const [likedMeals, setLikedMeals] = useState<Record<string, boolean>>({});
  const [savedMeals, setSavedMeals] = useState<Record<string, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("meals");
  const searchRef = useRef<TextInput>(null);

  const likeMutation = useMutation({
    mutationFn: ({ mealId, ownerId }: { mealId: string; ownerId: string }) =>
      toggleMealLike({ userId: currentUser!.id, mealId }),
    onMutate: ({ mealId }) => {
      setLikedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    },
    onSuccess: async (isNowLiked, { mealId, ownerId }) => {
      if (isNowLiked && currentUser) {
        await createMealLikeNotification({ actorUserId: currentUser.id, recipientUserId: ownerId, mealId });
      }
    },
    onError: (_err, { mealId }) => {
      setLikedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    }
  });

  const saveMutation = useMutation({
    mutationFn: ({ mealId }: { mealId: string }) =>
      toggleStarredMeal({ userId: currentUser!.id, mealId }),
    onMutate: ({ mealId }) => {
      setSavedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    },
    onError: (_err, { mealId }) => {
      setSavedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    }
  });

  function openSearch() {
    setIsSearching(true);
    setTimeout(() => searchRef.current?.focus(), 60);
  }

  function closeSearch() {
    setIsSearching(false);
    setSearchQuery("");
    Keyboard.dismiss();
  }

  const isLoading = feed.isLoading && !feed.data;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fixed top bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>Recipebook</Text>
        <Pressable style={styles.bellBtn} onPress={() => router.push("/(app)/notifications")}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Always-visible search strip — pill stays full width in both states */}
      <View style={styles.searchStrip}>
        <Pressable style={styles.searchPill} onPress={!isSearching ? openSearch : undefined}>
          <Ionicons name="search-outline" size={15} color={theme.colors.muted} />
          {isSearching ? (
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor={theme.colors.muted}
              returnKeyType="search"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.searchPlaceholder}>Search meals, recipes, people...</Text>
          )}
          {isSearching && (
            <Pressable onPress={closeSearch} hitSlop={12}>
              <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        </Pressable>
      </View>

      {/* Content: search UI or feed */}
      {isSearching ? (
        <SearchPane query={searchQuery} mode={searchMode} onModeChange={setSearchMode} />
      ) : (
        <FeedPane
          feed={feed}
          isLoading={isLoading}
          likedMeals={likedMeals}
          savedMeals={savedMeals}
          currentUser={currentUser}
          likeMutation={likeMutation}
          saveMutation={saveMutation}
          router={router}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Search pane ────────────────────────────────────────────────────────────

function SearchPane({
  query,
  mode,
  onModeChange
}: {
  query: string;
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
}) {
  const modes: { key: SearchMode; label: string }[] = [
    { key: "meals", label: "Meals" },
    { key: "recipes", label: "Recipes" },
    { key: "users", label: "People" }
  ];

  return (
    <View style={styles.searchPane}>
      {/* Mode tabs */}
      <View style={styles.modeTabs}>
        {modes.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.modeTab, mode === key && styles.modeTabActive]}
            onPress={() => onModeChange(key)}
          >
            <Text style={[styles.modeTabText, mode === key && styles.modeTabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Results */}
      <View style={styles.searchResults}>
        {query.trim().length === 0 ? (
          <View style={styles.searchEmpty}>
            <Ionicons name="search-outline" size={32} color={theme.colors.line} />
            <Text style={styles.searchEmptyTitle}>
              {mode === "meals" ? "Search your meals" : mode === "recipes" ? "Find recipes" : "Find people"}
            </Text>
            <Text style={styles.searchEmptyText}>
              {mode === "meals"
                ? "Search by meal name or caption."
                : mode === "recipes"
                  ? "Search by recipe title or cuisine."
                  : "Search by username or display name."}
            </Text>
          </View>
        ) : (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>Searching for "{query}"</Text>
            <Text style={styles.searchEmptyText}>Search results coming soon.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Feed pane ───────────────────────────────────────────────────────────────

function FeedPane({
  feed,
  isLoading,
  likedMeals,
  savedMeals,
  currentUser,
  likeMutation,
  saveMutation,
  router
}: {
  feed: ReturnType<typeof useFeed>;
  isLoading: boolean;
  likedMeals: Record<string, boolean>;
  savedMeals: Record<string, boolean>;
  currentUser: User | null;
  likeMutation: { isPending: boolean; mutate: (args: { mealId: string; ownerId: string }) => void };
  saveMutation: { isPending: boolean; mutate: (args: { mealId: string }) => void };
  router: ReturnType<typeof useRouter>;
}) {
  if (feed.isError) {
    return (
      <View style={styles.feedStateWrap}>
        <ErrorState
          title="Couldn't load feed"
          description={feed.error instanceof Error ? feed.error.message : "Pull down to retry."}
          actionLabel="Retry"
          onAction={() => void feed.refetch()}
        />
      </View>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.feedStateWrap}>
        <EmptyState title="No backend" description="Add Supabase env vars to load your feed." />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.feedStateWrap}>
        <LoadingState title="Loading feed" />
      </View>
    );
  }

  if (!feed.data?.length) {
    return (
      <View style={styles.feedStateWrap}>
        <EmptyState title="Nothing here yet" description="Follow people and create meals to fill your feed." />
      </View>
    );
  }

  return (
    <FlatList
      data={feed.data}
      keyExtractor={(item) => item.meal.id}
      contentContainerStyle={styles.feedList}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={feed.isFetching && !feed.isLoading}
          onRefresh={() => void feed.refetch()}
        />
      }
      renderItem={({ item }) => (
        <FeedCard
          item={item}
          isLiked={likedMeals[item.meal.id] ?? false}
          isSaved={savedMeals[item.meal.id] ?? false}
          currentUser={currentUser}
          isPending={likeMutation.isPending}
          onLike={() => {
            if (currentUser) likeMutation.mutate({ mealId: item.meal.id, ownerId: item.meal.ownerId });
          }}
          onSave={() => {
            if (currentUser) saveMutation.mutate({ mealId: item.meal.id });
          }}
          onComment={() => router.push({ pathname: "/(app)/comments", params: { mealId: item.meal.id } })}
          onPress={() => router.push({ pathname: "/(app)/meal-detail", params: { mealId: item.meal.id } })}
        />
      )}
    />
  );
}

// ─── Feed card ───────────────────────────────────────────────────────────────

function FeedCard({
  item,
  isLiked,
  isSaved,
  currentUser,
  isPending,
  onLike,
  onSave,
  onComment,
  onPress
}: {
  item: FeedItem;
  isLiked: boolean;
  isSaved: boolean;
  currentUser: User | null;
  isPending: boolean;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Author */}
      <View style={styles.authorRow}>
        <Avatar name={item.owner.displayName} uri={item.owner.profileImageUrl} size={32} />
        <Text style={styles.authorName}>{item.owner.displayName}</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.time}>{formatRelativeTime(item.meal.createdAt)}</Text>
      </View>

      {/* Photo */}
      <MealPhoto uri={item.meal.heroImageUrl} aspectRatio={3 / 2} style={styles.heroPhoto} />

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={[styles.mealTitle, { flex: 1 }]}>{item.meal.title}</Text>
          <View style={styles.rankPill}>
            <Text style={styles.rankText}>#{item.meal.rankPosition || 1}</Text>
          </View>
        </View>
        {item.recipe ? <Text style={styles.recipeName}>{item.recipe.title}</Text> : null}
        {item.meal.caption ? <Text style={styles.caption}>{item.meal.caption}</Text> : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          disabled={!currentUser || isPending}
          onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onLike(); }}
        >
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? theme.colors.accent : theme.colors.muted} />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onComment(); }}
        >
          <Ionicons name="chatbubble-outline" size={19} color={theme.colors.muted} />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          disabled={!currentUser || isPending}
          onPress={(e: GestureResponderEvent) => { e.stopPropagation(); onSave(); }}
        >
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={19} color={isSaved ? theme.colors.accent : theme.colors.muted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas
  },

  // Top bar
  topBar: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  appName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 24
  },
  bellBtn: {
    padding: theme.spacing.xxs
  },

  // Search strip
  searchStrip: {
    alignItems: "center",
    backgroundColor: theme.colors.canvas,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  searchPill: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card
  },
  searchPlaceholder: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadow.card
  },
  cancelText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 15
  },

  // Search pane
  searchPane: {
    flex: 1
  },
  modeTabs: {
    backgroundColor: theme.colors.canvas,
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  modeTab: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  modeTabActive: {
    backgroundColor: theme.colors.text
  },
  modeTabText: {
    ...theme.type.label,
    color: theme.colors.muted
  },
  modeTabTextActive: {
    color: theme.colors.white
  },
  searchResults: {
    flex: 1
  },
  searchEmpty: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxl
  },
  searchEmptyTitle: {
    ...theme.type.title,
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 18
  },
  searchEmptyText: {
    ...theme.type.body,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: 260
  },

  // Feed pane
  feedStateWrap: {
    flex: 1,
    padding: theme.spacing.lg
  },
  feedList: {
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl
  },

  // Card
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadow.card
  },
  cardPressed: {
    transform: [{ scale: 0.985 }]
  },
  authorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  authorName: {
    ...theme.type.label,
    color: theme.colors.text
  },
  dot: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  time: {
    ...theme.type.caption,
    color: theme.colors.muted
  },
  heroPhoto: {
    borderRadius: 0,
    width: "100%"
  },
  cardContent: {
    gap: theme.spacing.xxs,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  mealTitle: {
    ...theme.type.title,
    color: theme.colors.text
  },
  rankPill: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    marginTop: 3,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2
  },
  rankText: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 11
  },
  recipeName: {
    ...theme.type.caption,
    color: theme.colors.accent
  },
  caption: {
    ...theme.type.body,
    color: theme.colors.muted
  },
  actions: {
    borderTopColor: theme.colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  actionBtn: {
    padding: theme.spacing.xxs
  }
});
