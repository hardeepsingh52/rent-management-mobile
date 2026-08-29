import { getMyProperties } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { Property } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
}

// No vacancy status is tracked per unit yet, so occupancy is a placeholder:
// any property with units counts as fully occupied.
function propertyOccupancy(property: Property): number {
  return property.units.length > 0 ? 100 : 0;
}

// Decorative bar heights for the Occupancy Rates chart — there's no historical
// occupancy time series in the backend yet, so this isn't real month-over-month
// data, just a placeholder shape matching the design until that exists.
const OCCUPANCY_CHART_BARS = [
  { month: "Feb", height: 58 },
  { month: "Mar", height: 96 },
  { month: "Apr", height: 78 },
  { month: "May", height: 108 },
  { month: "Jun", height: 90 },
  { month: "Jul", height: 118 },
];

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
  const totalUnits = (properties ?? []).reduce(
    (sum, p) => sum + p.units.length,
    0,
  );
  // Placeholder, same reasoning as propertyOccupancy: no vacancy tracking yet.
  const occupiedUnits = totalUnits;

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
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user.fullName)}
                </Text>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.name}>{user.fullName}</Text>
                <Text style={styles.role}>{user.role}</Text>
              </View>
              <View style={styles.headerRight}>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => router.push("/properties/new")}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color="#16302b"
                  />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => comingSoon("Notifications")}
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={20}
                    color="#16302b"
                  />
                  <View style={styles.bellDot} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.screenSectionTitle}>Property Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={20}
                  color="#d9601f"
                />
                <Text style={styles.statLabel}>Properties</Text>
                <Text style={styles.statValue}>{totalProperties}</Text>
              </View>
              <View style={styles.statTile}>
                <MaterialCommunityIcons
                  name="door-open"
                  size={20}
                  color="#d9601f"
                />
                <Text style={styles.statLabel}>Occupied</Text>
                <Text style={styles.statValue}>
                  {occupiedUnits}
                  <Text style={styles.statValueMuted}>/{totalUnits}</Text>
                </Text>
              </View>
              <View style={styles.statTile}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={20}
                  color="#d9601f"
                />
                <Text style={styles.statLabel}>Rent Collected</Text>
                <Text style={styles.statValue}>—</Text>
              </View>
              <View style={styles.statTile}>
                <MaterialCommunityIcons
                  name="wrench-outline"
                  size={20}
                  color="#d9601f"
                />
                <Text style={styles.statLabel}>Maint. Request</Text>
                <Text style={styles.statValue}>0</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.sectionTitle}>Occupancy Rates</Text>
                <Pressable
                  style={styles.monthlyPill}
                  onPress={() => comingSoon("Date range filter")}
                >
                  <Text style={styles.monthlyPillText}>Monthly</Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={14}
                    color="#5f5e5a"
                  />
                </Pressable>
              </View>
              <View style={styles.chartRow}>
                <View style={styles.chartAxis}>
                  <Text style={styles.chartAxisLabel}>100%</Text>
                  <Text style={styles.chartAxisLabel}>70%</Text>
                  <Text style={styles.chartAxisLabel}>50%</Text>
                  <Text style={styles.chartAxisLabel}>10%</Text>
                </View>
                <View style={styles.chartBars}>
                  {OCCUPANCY_CHART_BARS.map((bar) => (
                    <View key={bar.month} style={styles.chartBarColumn}>
                      <View style={[styles.chartBar, { height: bar.height }]} />
                      <Text style={styles.chartBarLabel}>{bar.month}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable onPress={() => comingSoon("Activity history")}>
                <Text style={styles.viewAllLink}>View all →</Text>
              </Pressable>
            </View>
            <Text style={styles.empty}>No recent activity yet.</Text>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Properties</Text>
              <Pressable onPress={() => router.push("/properties")}>
                <Text style={styles.viewAllLink}>View all →</Text>
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
        renderItem={({ item }) => {
          const occupancy = propertyOccupancy(item);
          return (
            <Pressable
              style={styles.propertyCard}
              onPress={() =>
                router.push({
                  pathname: "/properties/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <View style={styles.propertyPhoto}>
                <MaterialCommunityIcons
                  name="home-city-outline"
                  size={26}
                  color="#d9601f"
                />
              </View>
              <View style={styles.propertyInfo}>
                <View style={styles.propertyTopRow}>
                  <Text style={styles.propertyName}>{item.line1}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Active</Text>
                  </View>
                </View>
                <View style={styles.propertyCityRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={12}
                    color="#8a8fa8"
                  />
                  <Text style={styles.propertyCity}>{item.city}</Text>
                </View>
                <View style={styles.propertyStatsRow}>
                  <View style={styles.propertyStat}>
                    <MaterialCommunityIcons
                      name="account-multiple-outline"
                      size={14}
                      color="#5f5e5a"
                    />
                    <Text style={styles.propertyStatValue}>0</Text>
                  </View>
                  <View style={styles.propertyStat}>
                    <MaterialCommunityIcons
                      name="door"
                      size={14}
                      color="#5f5e5a"
                    />
                    <Text style={styles.propertyStatValue}>
                      {item.units.length}
                    </Text>
                  </View>
                  <View style={styles.occupancyRing}>
                    <Text style={styles.occupancyRingText}>{occupancy}%</Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#c7cad9"
              />
            </Pressable>
          );
        }}
        ListFooterComponent={
          properties && properties.length > 0 ? (
            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={styles.quickAction}
                  onPress={() => router.push("/properties/new")}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      styles.quickActionIconGreen,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="home-plus-outline"
                      size={22}
                      color="#0f4a42"
                    />
                  </View>
                  <Text style={styles.quickActionLabel}>Add Property</Text>
                </Pressable>
                <Pressable
                  style={styles.quickAction}
                  onPress={() => comingSoon("Add Tenant")}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      styles.quickActionIconOrange,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={22}
                      color="#d9601f"
                    />
                  </View>
                  <Text style={styles.quickActionLabel}>Add Tenant</Text>
                </Pressable>
                <Pressable
                  style={styles.quickAction}
                  onPress={() => comingSoon("Add Rent")}
                >
                  <View
                    style={[styles.quickActionIcon, styles.quickActionIconBlue]}
                  >
                    <MaterialCommunityIcons
                      name="cash-plus"
                      size={22}
                      color="#1f6fd9"
                    />
                  </View>
                  <Text style={styles.quickActionLabel}>Add Rent</Text>
                </Pressable>
                <Pressable
                  style={styles.quickAction}
                  onPress={() => comingSoon("Reports")}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      styles.quickActionIconPurple,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="chart-bar"
                      size={22}
                      color="#7c4dff"
                    />
                  </View>
                  <Text style={styles.quickActionLabel}>Reports</Text>
                </Pressable>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  listContent: { paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#16302b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  headerCenter: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#16302b" },
  role: { fontSize: 12, color: "#8a8fa8", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#f4793a",
  },
  screenSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16302b",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  statTile: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  statLabel: { fontSize: 11, color: "#8a8fa8", marginTop: 8 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#16302b", marginTop: 2 },
  statValueMuted: { fontSize: 14, fontWeight: "500", color: "#b6b9c9" },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 20,
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthlyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f6fa",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  monthlyPillText: { fontSize: 11, fontWeight: "600", color: "#5f5e5a" },
  chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  chartAxis: { justifyContent: "space-between", height: 120, marginBottom: 18 },
  chartAxisLabel: { fontSize: 10, color: "#b6b9c9" },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chartBarColumn: { alignItems: "center", gap: 6 },
  chartBar: { width: 16, borderRadius: 6, backgroundColor: "#f4793a" },
  chartBarLabel: { fontSize: 10, color: "#8a8fa8" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#16302b" },
  viewAllLink: { fontSize: 12, fontWeight: "600", color: "#2f8a75" },
  error: { color: "#b91c1c", paddingHorizontal: 18, fontSize: 13 },
  empty: { color: "#5f5e5a", paddingHorizontal: 18, fontSize: 13 },
  propertyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  propertyPhoto: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#fdece0",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: { flex: 1, minWidth: 0 },
  propertyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  propertyName: { fontSize: 14, fontWeight: "700", color: "#16302b" },
  propertyCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  propertyCity: { fontSize: 11, color: "#8a8fa8" },
  propertyStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  propertyStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  propertyStatValue: { fontSize: 12, fontWeight: "600", color: "#5f5e5a" },
  occupancyRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#2f8a75",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  occupancyRingText: { fontSize: 9, fontWeight: "700", color: "#2f8a75" },
  badge: {
    backgroundColor: "#dff5f2",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#2f8a75" },
  quickActions: { paddingHorizontal: 18, marginTop: 10 },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  quickAction: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    gap: 10,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconGreen: { backgroundColor: "#dff5f2" },
  quickActionIconOrange: { backgroundColor: "#fdece0" },
  quickActionIconBlue: { backgroundColor: "#e3f0fc" },
  quickActionIconPurple: { backgroundColor: "#efe7fb" },
  quickActionLabel: { fontSize: 12, fontWeight: "600", color: "#16302b" },
});