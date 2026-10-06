import { Colors } from "@/constants/colors";
import { markNotificationRead } from "@/lib/notifications-api";
import { useNotificationsQuery } from "@/lib/queries";
import { useSession } from "@/lib/session-context";
import type { NotificationItem } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function NotificationsScreen() {
  const user = useSession();
  const queryClient = useQueryClient();
  const { data: notifications, refetch } = useNotificationsQuery();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handlePress(item: NotificationItem) {
    if (item.isRead) {
      return;
    }
    queryClient.setQueryData<NotificationItem[]>(
      ["notifications", "list", user.id],
      (current) =>
        current?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    await markNotificationRead(item.id, user.token);
    // Refresh the unread count shown on the Home bell.
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          notifications ? (
            <Text style={styles.emptyText}>No notifications yet.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentOrange,
  },
  title: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  body: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  emptyText: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: 40,
  },
});