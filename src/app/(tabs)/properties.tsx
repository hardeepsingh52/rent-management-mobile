import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/lib/session-context";
import { getMyProperties } from "@/lib/properties-api";
import type { Property } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
              <View style={styles.headerTitleGroup}>
                <Text style={styles.title}>Properties</Text>
                <Text style={styles.subtitle}>
                  Every property in your portfolio.
                </Text>
              </View>
              <Pressable
                style={styles.addButton}
                onPress={() => router.push("/properties/new")}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </Pressable>
            </View>

            {properties !== null && properties.length > 0 && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{properties.length}</Text>
                  <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalUnits}</Text>
                  <Text style={styles.statLabel}>Units</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{totalCities}</Text>
                  <Text style={styles.statLabel}>Cities</Text>
                </View>
              </View>
            )}

            {properties !== null && properties.length > 0 && (
              <TextInput
                style={styles.search}
                placeholder="Search by name or city"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
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
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.propertyType}</Text>
              </View>
            </View>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardAddress}>
              {item.line1}, {item.city}, {item.region}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.unitCount}>
                {item.units.length} unit{item.units.length === 1 ? "" : "s"}
              </Text>
              <View style={styles.viewLink}>
                <Text style={styles.viewLinkText}>View</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color="#1565c0"
                />
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: "600", color: "#111" },
  subtitle: { fontSize: 13, color: "#5f5e5a", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  viewLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewLinkText: { fontSize: 12, fontWeight: "500", color: "#1565c0" },
  statCard: {
    flex: 1,
    backgroundColor: "#f1efe8",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitleGroup: { flex: 1 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1565c0",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontWeight: "600", color: "#111" },
  statLabel: { fontSize: 11, color: "#5f5e5a", marginTop: 2 },
  search: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 16 },
  empty: { color: "#5f5e5a", fontSize: 13, marginTop: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 12,
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "flex-end" },
  badge: {
    backgroundColor: "#e6f1fb",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "500", color: "#1565c0" },
  cardName: { fontSize: 14, fontWeight: "600", color: "#111" },
  cardAddress: { fontSize: 12, color: "#5f5e5a" },
  cardFooter: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1efe8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitCount: { fontSize: 12, color: "#5f5e5a" },
});
