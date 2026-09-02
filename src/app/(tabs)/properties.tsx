import { Colors } from "@/constants/colors";
import { getMyProperties } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { Property } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
                  color={Colors.primaryDark}
                />
              </Pressable>
              <Text style={styles.title}>Properties</Text>
            </View>
            <Text style={styles.subtitle}>
              Every property in your portfolio.
            </Text>

            {properties !== null && properties.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statTile}>
                  <MaterialCommunityIcons
                    name="home-outline"
                    size={18}
                    color={Colors.accentOrange}
                  />
                  <Text style={styles.statValue}>{properties.length}</Text>
                  <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statTile}>
                  <MaterialCommunityIcons
                    name="door"
                    size={18}
                    color={Colors.accentOrange}
                  />
                  <Text style={styles.statValue}>{totalUnits}</Text>
                  <Text style={styles.statLabel}>Units</Text>
                </View>
                <View style={styles.statTile}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={18}
                    color={Colors.accentOrange}
                  />
                  <Text style={styles.statValue}>{totalCities}</Text>
                  <Text style={styles.statLabel}>Cities</Text>
                </View>
              </View>
            )}

            {properties !== null && properties.length > 0 && (
              <View style={styles.searchRow}>
                <View style={styles.search}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={16}
                    color={Colors.textMuted}
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
                    color={Colors.primaryDark}
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
        renderItem={({ item }) => (
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
              <View style={styles.photoWrap}>
                {/* No property-photo feature exists in the backend yet, so
                    every property uses the same placeholder image. */}
                <Image
                  source={require("@/assets/images/property-placeholder.jpg")}
                  style={styles.photo}
                  contentFit="cover"
                />
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText} numberOfLines={1}>
                    {formatPropertyType(item.propertyType)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardCityRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={11}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.cardCity}>{item.city}</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardStatsRow}>
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="door"
                  size={13}
                  color={Colors.accentOrange}
                />
                <Text style={styles.pillText}>{item.units.length} Units</Text>
              </View>
              <View style={styles.pill}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={13}
                  color={Colors.accentOrange}
                />
                {/* No tenant data tracked yet, so this is always 0. */}
                <Text style={styles.pillText}>0 Tenants</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={Colors.borderLight}
              />
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          properties !== null && properties.length > 0 ? (
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/properties/new")}
            >
              <MaterialCommunityIcons name="plus" size={16} color={Colors.white} />
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
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginLeft: 44 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  statTile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginTop: 8,
  },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  searchRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 13 },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: Colors.errorText, fontSize: 13, marginTop: 16 },
  empty: { color: Colors.textMutedDark, fontSize: 13, marginTop: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  photoWrap: { position: "relative" },
  photo: { width: 72, height: 72, borderRadius: 12 },
  typeBadge: {
    position: "absolute",
    left: 5,
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(22, 48, 43, 0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: { fontSize: 8, fontWeight: "600", color: Colors.white },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  cardCityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  cardCity: { fontSize: 11, color: Colors.textMuted },
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
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pillText: { fontSize: 11, fontWeight: "600", color: Colors.primaryDark },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accentOrange,
    borderRadius: 28,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 16,
  },
  addButtonText: { fontSize: 13, fontWeight: "700", color: Colors.white },
});