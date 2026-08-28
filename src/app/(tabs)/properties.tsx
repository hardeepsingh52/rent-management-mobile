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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
}

function formatPropertyType(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

type PropertyVisual = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  accent: string;
};

function getPropertyVisual(propertyType: string): PropertyVisual {
  const type = propertyType.toLowerCase();
  if (
    type.includes("apartment") ||
    type.includes("condo") ||
    type.includes("town")
  ) {
    return { icon: "office-building", tint: "#e3f0fc", accent: "#1f6fd9" };
  }
  if (type.includes("mobile")) {
    return { icon: "home-variant-outline", tint: "#dff5f2", accent: "#2f8a75" };
  }
  return { icon: "home-city-outline", tint: "#fdece0", accent: "#d9601f" };
}

export default function PropertiesScreen() {
  const user = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  const query = search.trim().toLowerCase();
  const filtered = (properties ?? []).filter(
    (property) =>
      !query ||
      property.name.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query),
  );

  const totalUnits = (properties ?? []).reduce(
    (sum, p) => sum + p.units.length,
    0,
  );
  const totalCities = new Set((properties ?? []).map((p) => p.city)).size;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={18}
                  color="#16302b"
                />
              </Pressable>
              <Text style={styles.title}>Properties</Text>
            </View>
            <Text style={styles.subtitle}>
              Every property in your portfolio.
            </Text>

            {properties !== null && properties.length > 0 && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: "#dff5f2" }]}>
                  <View style={styles.statTop}>
                    <View style={styles.statIcon}>
                      <MaterialCommunityIcons
                        name="home-outline"
                        size={16}
                        color="#0f4a42"
                      />
                    </View>
                    <View style={styles.statTrend}>
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={12}
                        color="#2f8a75"
                      />
                    </View>
                  </View>
                  <Text style={[styles.statValue, { color: "#0f4a42" }]}>
                    {properties.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: "#0f4a42" }]}>
                    Properties
                  </Text>
                  <View style={styles.statDivider} />
                  <Pressable
                    style={styles.statLink}
                    onPress={() => comingSoon("This view")}
                  >
                    <Text style={[styles.statLinkText, { color: "#2f8a75" }]}>
                      View all
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={12}
                      color="#2f8a75"
                    />
                  </Pressable>
                </View>

                <View style={[styles.statCard, { backgroundColor: "#fdece0" }]}>
                  <View style={styles.statTop}>
                    <View style={styles.statIcon}>
                      <MaterialCommunityIcons
                        name="door"
                        size={16}
                        color="#8a3d10"
                      />
                    </View>
                    <View style={styles.statTrend}>
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={12}
                        color="#d9601f"
                      />
                    </View>
                  </View>
                  <Text style={[styles.statValue, { color: "#8a3d10" }]}>
                    {totalUnits}
                  </Text>
                  <Text style={[styles.statLabel, { color: "#8a3d10" }]}>
                    Units
                  </Text>
                  <View style={styles.statDivider} />
                  <Pressable
                    style={styles.statLink}
                    onPress={() => comingSoon("Units")}
                  >
                    <Text style={[styles.statLinkText, { color: "#d9601f" }]}>
                      View all
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={12}
                      color="#d9601f"
                    />
                  </Pressable>
                </View>

                <View style={[styles.statCard, { backgroundColor: "#e3f0fc" }]}>
                  <View style={styles.statTop}>
                    <View style={styles.statIcon}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={16}
                        color="#1f6fd9"
                      />
                    </View>
                    <View style={styles.statTrend}>
                      <MaterialCommunityIcons
                        name="trending-up"
                        size={12}
                        color="#1f6fd9"
                      />
                    </View>
                  </View>
                  <Text style={[styles.statValue, { color: "#1f6fd9" }]}>
                    {totalCities}
                  </Text>
                  <Text style={[styles.statLabel, { color: "#1f6fd9" }]}>
                    Cities
                  </Text>
                  <View style={styles.statDivider} />
                  <Pressable
                    style={styles.statLink}
                    onPress={() => comingSoon("Cities")}
                  >
                    <Text style={[styles.statLinkText, { color: "#1f6fd9" }]}>
                      View all
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={12}
                      color="#1f6fd9"
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {properties !== null && properties.length > 0 && (
              <View style={styles.searchRow}>
                <View style={styles.search}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={16}
                    color="#8a8fa8"
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search properties..."
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                  />
                </View>
                <Pressable
                  style={styles.filterButton}
                  onPress={() => comingSoon("Filters")}
                >
                  <MaterialCommunityIcons
                    name="tune-variant"
                    size={16}
                    color="#16302b"
                  />
                </Pressable>
              </View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}
            {properties === null && !error && (
              <ActivityIndicator style={{ marginTop: 20 }} />
            )}
            {properties !== null && properties.length === 0 && (
              <Text style={styles.empty}>No properties added yet.</Text>
            )}
            {properties !== null &&
              properties.length > 0 &&
              filtered.length === 0 && (
                <Text style={styles.empty}>
                  No properties match &quot;{search}&quot;.
                </Text>
              )}
          </View>
        }
        renderItem={({ item }) => {
          const visual = getPropertyVisual(item.propertyType);
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/properties/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={[styles.photo, { backgroundColor: visual.tint }]}>
                  <MaterialCommunityIcons
                    name={visual.icon}
                    size={24}
                    color={visual.accent}
                  />
                  {/* No property status tracked yet, so every card shows Active. */}
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={16}
                      color="#8a8fa8"
                    />
                  </View>
                  <View style={styles.cardMetaRow}>
                    <View style={styles.cardCityRow}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={11}
                        color="#8a8fa8"
                      />
                      <Text style={styles.cardCity}>{item.city}</Text>
                    </View>
                    <View
                      style={[styles.badge, { backgroundColor: visual.tint }]}
                    >
                      <Text
                        style={[styles.badgeText, { color: visual.accent }]}
                      >
                        {formatPropertyType(item.propertyType)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.cardStatsRow}>
                <View style={[styles.pill, { backgroundColor: "#dff5f2" }]}>
                  <MaterialCommunityIcons
                    name="home-outline"
                    size={13}
                    color="#0f4a42"
                  />
                  <View>
                    <Text style={styles.pillValue}>{item.units.length}</Text>
                    <Text style={[styles.pillLabel, { color: "#0f4a42" }]}>
                      Units
                    </Text>
                  </View>
                </View>
                <View style={[styles.pill, { backgroundColor: "#fdece0" }]}>
                  <MaterialCommunityIcons
                    name="account-multiple-outline"
                    size={13}
                    color="#8a3d10"
                  />
                  <View>
                    {/* No tenant data tracked yet, so this is always 0. */}
                    <Text style={styles.pillValue}>0</Text>
                    <Text style={[styles.pillLabel, { color: "#8a3d10" }]}>
                      Tenants
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#c7cad9"
                />
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          properties !== null && properties.length > 0 ? (
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/properties/new")}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add new property</Text>
            </Pressable>
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
  header: { paddingHorizontal: 20, paddingTop: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#16302b" },
  subtitle: { fontSize: 12, color: "#8a8fa8", marginTop: 4, marginLeft: 44 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12 },
  statTop: { flexDirection: "row", justifyContent: "space-between" },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  statTrend: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700", marginTop: 10 },
  statLabel: { fontSize: 10, marginTop: 1 },
  statDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginTop: 10,
    marginBottom: 8,
  },
  statLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  statLinkText: { fontSize: 10, fontWeight: "600" },
  searchRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13 },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 16 },
  empty: { color: "#5f5e5a", fontSize: 13, marginTop: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#16302b",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 8, fontWeight: "600", color: "#fff" },
  cardInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
  cardNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16302b",
    flexShrink: 1,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardCityRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardCity: { fontSize: 10, color: "#8a8fa8" },
  badge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: "600" },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillValue: { fontSize: 11, fontWeight: "700", color: "#16302b" },
  pillLabel: { fontSize: 8 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16302b",
    borderRadius: 16,
    paddingVertical: 13,
    marginHorizontal: 20,
    marginTop: 16,
  },
  addButtonText: { fontSize: 12, fontWeight: "600", color: "#fff" },
});
