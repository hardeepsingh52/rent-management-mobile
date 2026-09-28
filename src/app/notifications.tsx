import { Colors } from "@/constants/colors";
import {
  getMyNotifications,
  markNotificationRead,
} from "@/lib/notifications-api";
import { useSession } from "@/lib/session-context";
import type { NotificationItem } from "@/lib/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
  const [notifications, setNotifications] = useState<
    NotificationItem[] | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getMyNotifications(user.token);
    setNotifications(data);
  }, [user.token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handlePress(item: NotificationItem) {
    if (item.isRead) {
      return;
    }
    setNotifications(
      (current) =>
        current?.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)) ??
        null,
    );
    await markNotificationRead(item.id, user.token);
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
          notifications !== null ? (
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