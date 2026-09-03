import { SideMenu } from "@/components/side-menu";
import { Colors } from "@/constants/colors";
import { getMyProperties } from "@/lib/properties-api";
import { useSession, useSessionContext } from "@/lib/session-context";
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
  ScrollView,
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

function RentPeriodRow({
  title,
  percentLabel,
  percent,
  collected,
  outstanding,
}: {
  title: string;
  percentLabel: string;
  percent: number;
  collected: string;
  outstanding: string;
}) {
  return (
    <View>
      <View style={styles.rentPeriodHeaderRow}>
        <Text style={styles.rentPeriodTitle}>{title}</Text>
        <Text style={styles.rentPeriodCaption}>{percentLabel}</Text>
      </View>
      <View style={styles.rentProgressTrack}>
        <View style={[styles.rentProgressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.rentValuesRow}>
        <View style={styles.rentValueCol}>
          <View style={styles.rentValueLabelRow}>
            <View style={[styles.rentDot, styles.rentDotCollected]} />
            <Text style={styles.rentValueLabel}>Collected</Text>
          </View>
          <Text style={styles.rentValueAmount}>{collected}</Text>
        </View>
        <View style={styles.rentValueCol}>
          <View style={styles.rentValueLabelRow}>
            <View style={[styles.rentDot, styles.rentDotOutstanding]} />
            <Text style={styles.rentValueLabel}>Outstanding</Text>
          </View>
          <Text style={styles.rentValueAmount}>{outstanding}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const user = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { signOut } = useSessionContext();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.replace("/(auth)/login");
  }
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
  // No vacancy status is tracked per unit yet, so every unit counts as occupied.
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
              <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
                <MaterialCommunityIcons name="menu" size={20} color={Colors.primaryDark} />
              </Pressable>
              <View style={styles.headerRight}>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => router.push("/properties/new")}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={Colors.primaryDark}
                  />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => comingSoon("Notifications")}
                >
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={20}
                    color={Colors.primaryDark}
                  />
                  <View style={styles.bellDot} />
                </Pressable>
              </View>
              <View style={styles.logoWrap} pointerEvents="none">
                <Text style={styles.logoText}>
                  Domus<Text style={styles.logoTextAccent}>PRO</Text>
                </Text>
              </View>
            </View>

            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user.fullName)}
                </Text>
              </View>
              <View>
                <Text style={styles.name}>{user.fullName}</Text>
                <Text style={styles.role}>{user.role}</Text>
              </View>
            </View>

            <Text style={styles.screenSectionTitle}>Property Summary</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              <View style={[styles.statTile, { backgroundColor: Colors.greenDark }]}>
                <View style={styles.statTopRow}>
                  <MaterialCommunityIcons
                    name="home-city-outline"
                    size={15}
                    color={Colors.tealTint}
                  />
                  <Text style={[styles.statLabel, { color: Colors.tealTint }]}>
                    Properties
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: Colors.white }]}>
                  {totalProperties}
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: Colors.accentOrange }]}>
                <View style={styles.statTopRow}>
                  <MaterialCommunityIcons
                    name="door-open"
                    size={15}
                    color={Colors.orangeTint}
                  />
                  <Text style={[styles.statLabel, { color: Colors.orangeTint }]}>
                    Occupied
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: Colors.white }]}>
                  {occupiedUnits}
                  <Text style={[styles.statValueMuted, { color: Colors.orangeTint }]}>
                    /{totalUnits}
                  </Text>
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: Colors.purple }]}>
                <View style={styles.statTopRow}>
                  <MaterialCommunityIcons
                    name="wrench-outline"
                    size={15}
                    color={Colors.purpleTint}
                  />
                  <Text style={[styles.statLabel, { color: Colors.purpleTint }]}>
                    Maint.
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: Colors.white }]}>0</Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: Colors.accentBlue }]}>
                <View style={styles.statTopRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={15}
                    color={Colors.blueTint}
                  />
                  <Text style={[styles.statLabel, { color: Colors.blueTint }]}>
                    Vacancy
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: Colors.white }]}>0</Text>
              </View>
            </ScrollView>

            <Text style={styles.screenSectionTitle}>Rent Overview</Text>
            <View style={styles.rentOverviewCard}>
              {/* No rent-tracking backend exists yet, so both periods show an
                  honest "no data" state instead of a fabricated percentage —
                  same reasoning as the Rent Collected stat tile above. Once
                  real data exists, compute percent/collected/outstanding per
                  period and pass those in instead. */}
              <RentPeriodRow
                title="Last month"
                percentLabel="No data yet"
                percent={0}
                collected="—"
                outstanding="—"
              />
              <View style={styles.rentDivider} />
              <RentPeriodRow
                title="This month"
                percentLabel="No data yet"
                percent={0}
                collected="—"
                outstanding="—"
              />
            </View>

            {/* <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Pressable onPress={() => comingSoon("Activity history")}>
                <Text style={styles.viewAllLink}>View all →</Text>
              </Pressable>
            </View>
            <Text style={styles.empty}>No recent activity yet.</Text> */}

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
        
                renderItem={({ item }) => (
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
                size={20}
                color={Colors.accentOrange}
              />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName} numberOfLines={1}>
                {item.line1}
              </Text>
              <Text style={styles.propertyCity}>
                {item.city} · {item.units.length} unit
                {item.units.length === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </Pressable>
        )}

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
                      color={Colors.greenDark}
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
                      color={Colors.accentOrange}
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
                      color={Colors.accentBlue}
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
                      color={Colors.purple}
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

            <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(path) => router.push(path)}
        onSignOut={handleSignOut}
        role={user.role}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 24 },
  header: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 18, fontWeight: "700", color: Colors.primaryDark },
  logoTextAccent: { color: Colors.brandRed },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: Colors.white },
  name: { fontSize: 16, fontWeight: "700", color: Colors.primaryDark },
  role: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.accentOrange,
  },
  screenSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryDark,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  statsScroll: { gap: 8, paddingHorizontal: 18, marginBottom: 20 },
  statTile: {
    width: 100,
    height: 80,
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
  },
  statTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 17, fontWeight: "700" },
  statValueMuted: { fontSize: 12, fontWeight: "500" },
  rentOverviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 20,
  },
  rentPeriodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  rentPeriodTitle: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
  rentPeriodCaption: { fontSize: 10, color: Colors.textMuted },
  rentProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orangeTint,
    overflow: "hidden",
    marginBottom: 10,
  },
  rentProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.greenDark,
  },
  rentValuesRow: { flexDirection: "row", gap: 8 },
  rentValueCol: { flex: 1 },
  rentValueLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  rentValueLabel: { fontSize: 10, color: Colors.textMutedDark },
  rentValueAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginTop: 2,
    marginLeft: 11,
  },
  rentDot: { width: 6, height: 6, borderRadius: 3 },
  rentDotCollected: { backgroundColor: Colors.greenDark },
  rentDotOutstanding: { backgroundColor: Colors.accentOrange },
  rentDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 16 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.primaryDark },
  viewAllLink: { fontSize: 12, fontWeight: "600", color: Colors.accentTeal },
  error: { color: Colors.errorText, paddingHorizontal: 18, fontSize: 13 },
  empty: { color: Colors.textMutedDark, paddingHorizontal: 18, fontSize: 13 },
  propertyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 18,
    marginBottom: 10,
  },
  propertyPhoto: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.orangeTint,
    alignItems: "center",
    justifyContent: "center",
  },
  propertyInfo: { flex: 1, minWidth: 0 },
  propertyName: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  propertyCity: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: Colors.tealTint,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: Colors.accentTeal },
  quickActions: { paddingHorizontal: 18, marginTop: 10 },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  quickAction: {
    width: "47%",
    backgroundColor: Colors.white,
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
  quickActionIconGreen: { backgroundColor: Colors.tealTint },
  quickActionIconOrange: { backgroundColor: Colors.orangeTint },
  quickActionIconBlue: { backgroundColor: Colors.blueTint },
  quickActionIconPurple: { backgroundColor: Colors.purpleTint },
  quickActionLabel: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
});