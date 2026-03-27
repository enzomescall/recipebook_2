import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Avatar, Button, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { Screen } from "../../components/layout";
import { theme } from "../../constants/theme";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { useNotifications } from "../../hooks/use-notifications";
import type { RichNotification } from "../../hooks/use-notifications";
import { formatRelativeTime } from "../../features/feed/format";

function notificationCopy(type: string) {
  switch (type) {
    case "follow":
      return "started following you";
    case "meal_like":
      return "liked your meal";
    case "meal_comment":
      return "commented on your meal";
    case "comment_reply":
      return "replied to your comment";
    case "comment_like":
      return "liked your comment";
    case "mention":
      return "mentioned you";
    case "meal_star":
      return "starred your meal";
    default:
      return "sent an update";
  }
}

function notificationDetail(type: string): string | null {
  switch (type) {
    case "follow":
      return null;
    case "meal_like":
      return "Tap to see the meal";
    case "meal_comment":
      return "Tap to read comments";
    case "comment_reply":
      return "Tap to read the reply";
    case "comment_like":
      return "Tap to see your comment";
    case "meal_star":
      return "Tap to see the meal";
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications();
  const isLoading = notifications.isLoading && !notifications.data;

  function handlePress(item: RichNotification) {
    notifications.markRead(item.id);

    switch (item.type) {
      case "follow":
        router.push({ pathname: "/(app)/profile" });
        break;
      case "meal_like":
      case "meal_star":
        if (item.targetId) {
          router.push({ pathname: "/(app)/meal-detail", params: { mealId: item.targetId } });
        }
        break;
      case "meal_comment":
      case "comment_reply":
        if (item.targetId) {
          router.push({ pathname: "/(app)/comments", params: { mealId: item.targetId } });
        }
        break;
      case "comment_like":
      default:
        break;
    }
  }

  return (
    <Screen
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={notifications.isFetching && !notifications.isLoading} onRefresh={() => void notifications.refetch()} />
        )
      }}
    >
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <Text style={styles.title}>A lightweight place for social activity and reminders.</Text>
        <Text style={styles.subtitle}>
          {isSupabaseConfigured
            ? "Live alerts for follows, likes, comments, and replies."
            : "Connect Supabase to load your notification list."}
        </Text>
      </View>

      {notifications.isError ? (
        <ErrorState
          title="Could not load notifications"
          description={notifications.error instanceof Error ? notifications.error.message : "Try refreshing the list."}
          actionLabel="Retry"
          onAction={() => void notifications.refetch()}
        />
      ) : null}

      {!isSupabaseConfigured ? (
        <EmptyState
          title="Connect your backend"
          description="Add the Supabase env vars to see follows, likes, comments, and mentions."
          actionLabel="Refresh"
          onAction={() => void notifications.refetch()}
        />
      ) : isLoading ? (
        <LoadingState title="Loading notifications" description="Checking for new activity." />
      ) : notifications.data?.length ? (
        <View style={styles.list}>
          {notifications.data.map((item) => {
            const displayName = item.actorDisplayName ?? "Recipebook";
            const detail = notificationDetail(item.type);

            return (
              <Pressable key={item.id} onPress={() => handlePress(item)}>
                <Card>
                  <View style={styles.row}>
                    <Avatar
                      name={displayName}
                      source={item.actorProfileImageUrl ? { uri: item.actorProfileImageUrl } : undefined}
                      size={40}
                    />
                    <View style={styles.copy}>
                      <View style={styles.rowTop}>
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
                      </View>
                      {item.actorUsername ? (
                        <Text style={styles.username}>@{item.actorUsername}</Text>
                      ) : null}
                      <Text style={styles.note}>{notificationCopy(item.type)}</Text>
                      {detail ? (
                        <Text style={styles.detail}>{detail}</Text>
                      ) : null}
                    </View>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  {!item.read ? (
                    <Button
                      label="Mark read"
                      size="sm"
                      variant="secondary"
                      onPress={() => void notifications.markRead(item.id)}
                      loading={notifications.isMarkingRead}
                    />
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="No notifications yet"
          description="Likes, comments, follows, and mentions will show up here."
          actionLabel="Refresh"
          onAction={() => void notifications.refetch()}
        />
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
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serifBold,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: 340
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 360
  },
  list: {
    gap: theme.spacing.md
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  rowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: 3
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.sansBold,
    fontSize: 15
  },
  username: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  note: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.sansBold,
    fontSize: 13
  },
  detail: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  time: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  unreadDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: 99,
    height: 10,
    marginTop: 5,
    width: 10
  }
});
