import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSession } from "@/lib/session-context";
import { getMyProperties } from "@/lib/properties-api";
import type { Property } from "@/lib/types";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardScreen() {
  const user = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyProperties(user.token);
      setProperties(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load properties.",
      );
    }
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

  const totalProperties = properties?.length ?? 0;
  const occupancy = totalProperties > 0 ? "100%" : "0%";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={properties ?? []}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.banner}>
              <View>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.name}>{user.fullName}</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user.fullName)}
                </Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={20}
                  color="#0f4a42"
                />
                <Text style={styles.kpiValue}>{totalProperties}</Text>
                <Text style={styles.kpiLabel}>Properties</Text>
              </View>
              <View style={[styles.kpiCard, styles.kpiCardOccupancy]}>
                <MaterialCommunityIcons
                  name="checkbox-marked-circle-outline"
                  size={20}
                  color="#8a3d10"
                />
                <Text style={[styles.kpiValue, styles.kpiValueOccupancy]}>
                  {occupancy}
                </Text>
                <Text style={[styles.kpiLabel, styles.kpiLabelOccupancy]}>
                  Occupancy
                </Text>
              </View>
            </View>

            <View style={styles.revenueCard}>
              <View>
                <Text style={styles.revenueLabel}>Revenue</Text>
                <Text style={styles.revenueValue}>Not tracked yet</Text>
              </View>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={22}
                color="#f4793a"
              />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Your properties</Text>
              <Pressable onPress={() => router.push("/properties")}>
                <Text style={styles.viewAllLink}>View all</Text>
              </Pressable>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
            {properties === null && !error && (
              <ActivityIndicator style={{ marginTop: 20 }} />
            )}
            {properties !== null && properties.length === 0 && (
              <Text style={styles.empty}>No properties added yet.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.propertyRow}
            onPress={() =>
              router.push({
                pathname: "/properties/[id]",
                params: { id: String(item.id) },
              })
            }
          >
            <View style={styles.propertyIcon}>
              <MaterialCommunityIcons
                name="home-outline"
                size={22}
                color="#d9601f"
              />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{item.line1}</Text>
              <Text style={styles.propertyCity}>{item.city}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  listContent: { paddingBottom: 24 },
  banner: {
    backgroundColor: "#16302b",
    paddingHorizontal: 20,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  name: { fontSize: 19, fontWeight: "600", color: "#fff", marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f4793a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#dff5f2",
    borderRadius: 16,
    padding: 14,
  },
  kpiCardOccupancy: { backgroundColor: "#fdece0" },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0f4a42",
    marginTop: 2,
  },
  kpiLabelOccupancy: { color: "#8a3d10" },
  kpiValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "#0f4a42",
    marginTop: 10,
  },
  kpiValueOccupancy: { color: "#8a3d10" },
  revenueCard: {
    backgroundColor: "#16302b",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#16302b" },
  viewAllLink: { fontSize: 12, fontWeight: "500", color: "#d9601f" },
  error: { color: "#b91c1c", paddingHorizontal: 18, fontSize: 13 },
  empty: { color: "#5f5e5a", paddingHorizontal: 18, fontSize: 13 },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fdece0",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: { flex: 1, minWidth: 0 },
  propertyName: { fontSize: 14, fontWeight: "600", color: "#16302b" },
  propertyCity: { fontSize: 11, color: "#8a8fa8", marginTop: 3 },
  badge: {
    backgroundColor: "#dff5f2",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#2f8a75" },
});
