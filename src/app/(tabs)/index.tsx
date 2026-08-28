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
  const occupancyPct = totalProperties > 0 ? 100 : 0;

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
              <Pressable onPress={() => comingSoon("The menu")}>
                <MaterialCommunityIcons name="menu" size={26} color="#16302b" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.name}>{user.fullName} 👋</Text>
                <Text style={styles.subtitle}>
                  Here&apos;s what&apos;s happening today
                </Text>
              </View>
              <View style={styles.headerRight}>
                <Pressable
                  style={styles.bellButton}
                  onPress={() => comingSoon("Notifications")}
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={20}
                    color="#16302b"
                  />
                  <View style={styles.bellDot} />
                </Pressable>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(user.fullName)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiTop}>
                  <View style={styles.kpiIcon}>
                    <MaterialCommunityIcons
                      name="home-outline"
                      size={18}
                      color="#0f4a42"
                    />
                  </View>
                  <Text style={styles.kpiLabel}>Total Properties</Text>
                </View>
                <Text style={styles.kpiValue}>{totalProperties}</Text>
                <Pressable onPress={() => router.push("/properties")}>
                  <Text style={styles.kpiLink}>View all →</Text>
                </Pressable>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardOccupancy]}>
                <View style={styles.kpiTop}>
                  <View style={[styles.kpiIcon, styles.kpiIconOccupancy]}>
                    <MaterialCommunityIcons
                      name="chart-donut"
                      size={18}
                      color="#8a3d10"
                    />
                  </View>
                  <Text style={[styles.kpiLabel, styles.kpiLabelOccupancy]}>
                    Occupancy Rate
                  </Text>
                </View>
                <Text style={[styles.kpiValue, styles.kpiValueOccupancy]}>
                  {occupancyPct}%
                </Text>
                <Text style={styles.kpiCaptionOccupancy}>
                  {occupancyPct === 100
                    ? "Fully occupied 🎉"
                    : "Add units to track occupancy"}
                </Text>
              </View>
            </View>

            <View style={styles.revenueCard}>
              <View style={styles.revenueLeft}>
                <View style={styles.revenueIcon}>
                  <MaterialCommunityIcons
                    name="wallet-outline"
                    size={20}
                    color="#16302b"
                  />
                </View>
                <Text style={styles.revenueLabel}>Revenue</Text>
                <Text style={styles.revenueValue}>Not tracked yet</Text>
                <Text style={styles.revenueDescription}>
                  Track your income and grow your business.
                </Text>
              </View>
              <View style={styles.revenueRight}>
                <Pressable
                  style={styles.addRentButton}
                  onPress={() => comingSoon("Add Rent")}
                >
                  <Text style={styles.addRentButtonText}>Add Rent</Text>
                </Pressable>
                <View style={styles.revenueChart}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={16}
                    color="rgba(255,255,255,0.5)"
                  />
                  <View style={styles.revenueBars}>
                    <View style={[styles.revenueBar, { height: 10 }]} />
                    <View style={[styles.revenueBar, { height: 16 }]} />
                    <View style={[styles.revenueBar, { height: 22 }]} />
                    <View style={[styles.revenueBar, { height: 30 }]} />
                  </View>
                </View>
              </View>
            </View>

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
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 18,
  },
  headerCenter: { flex: 1, marginLeft: 14 },
  greeting: { fontSize: 13, color: "#8a8fa8" },
  name: { fontSize: 19, fontWeight: "700", color: "#16302b", marginTop: 2 },
  subtitle: { fontSize: 12, color: "#8a8fa8", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  bellButton: {
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#16302b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#dff5f2",
    borderRadius: 16,
    padding: 14,
  },
  kpiCardOccupancy: { backgroundColor: "#fdece0" },
  kpiTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiIconOccupancy: {},
  kpiLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0f4a42",
    flexShrink: 1,
  },
  kpiLabelOccupancy: { color: "#8a3d10" },
  kpiValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f4a42",
    marginTop: 10,
  },
  kpiValueOccupancy: { color: "#8a3d10" },
  kpiLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f8a75",
    marginTop: 8,
  },
  kpiCaptionOccupancy: {
    fontSize: 11,
    color: "#8a3d10",
    marginTop: 8,
  },
  revenueCard: {
    backgroundColor: "#16302b",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  revenueLeft: { flex: 1, paddingRight: 10 },
  revenueIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  revenueValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  revenueDescription: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 6,
  },
  revenueRight: { alignItems: "flex-end", justifyContent: "space-between" },
  addRentButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  addRentButtonText: { fontSize: 12, fontWeight: "700", color: "#16302b" },
  revenueChart: { alignItems: "flex-end", marginTop: 14 },
  revenueBars: {
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-end",
    marginTop: 4,
  },
  revenueBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
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
