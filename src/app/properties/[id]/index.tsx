import { Colors } from "@/constants/colors";
import { getProperty } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { Property, Unit } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// No vacancy status is tracked per property yet, so occupancy is a placeholder:
// any property with units counts as fully occupied. Same logic as the dashboard.
function propertyOccupancy(property: Property): number {
  return property.units.length > 0 ? 100 : 0;
}

function unitStatusTint(status: string): string {
  return status.toLowerCase() === "occupied"
    ? Colors.accentTeal
    : Colors.accentOrange;
}

function unitStatusBg(status: string): string {
  return status.toLowerCase() === "occupied"
    ? Colors.tealTint
    : Colors.orangeTint;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useSession();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getProperty(id, user.token);
      setProperty(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property.");
    }
  }, [id, user.token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

    

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={Colors.primaryDark}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.name}
        </Text>
        <Pressable
          style={styles.iconButton}
          onPress={() =>
            router.push({
              pathname: "/properties/[id]/units/new",
              params: { id },
            })
          }
        >
          <MaterialCommunityIcons name="plus" size={22} color={Colors.primaryDark} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.photoWrap}>
          {/* No property-photo feature exists in the backend yet, so every
              property uses the same placeholder image. */}
          <Image
            source={require("@/assets/images/property-placeholder.jpg")}
            style={styles.photo}
            contentFit="cover"
          />
        </View>

        <View style={styles.propertyInfoCard}>
          <View style={styles.propertyInfoText}>
            <Text style={styles.propertyInfoName} numberOfLines={1}>
              {property.line1}
            </Text>
            <Text style={styles.propertyInfoSubtitle}>
              {property.city} · {property.units.length} unit
              {property.units.length === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Rent Collected</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Rent Due</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{propertyOccupancy(property)}%</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Open Request</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>List of Units</Text>
          <Text style={styles.unitsCount}>{property.units.length} Units</Text>
        </View>
        <View style={styles.unitsList}>
          {property.units.map((unit: Unit) => (
            <Pressable
              key={unit.id}
              style={styles.unitCard}
              onPress={() =>
                router.push({
                  pathname: "/properties/[id]/units/[unitId]",
                  params: { id, unitId: String(unit.id) },
                })
              }
            >
              <View>
                <Text style={styles.unitLabel}>{unit.label}</Text>
                <Text style={styles.unitBeds}>
                  {unit.bedrooms} bed · {unit.bathrooms} bath
                </Text>
              </View>
              <View
                style={[
                  styles.unitStatusPill,
                  { backgroundColor: unitStatusBg(unit.status) },
                ]}
              >
                <Text
                  style={[
                    styles.unitStatusText,
                    { color: unitStatusTint(unit.status) },
                  ]}
                >
                  {unit.status}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.addUnitLink}
          onPress={() =>
            router.push({
              pathname: "/properties/[id]/units/new",
              params: { id },
            })
          }
        >
          <MaterialCommunityIcons name="plus" size={14} color={Colors.accentOrange} />
          <Text style={styles.addUnitLinkText}>Add unit</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  error: { color: Colors.errorText, fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primaryDark,
    textAlign: "left",
    marginHorizontal: 10,
  },
  photoWrap: { position: "relative" },
  photo: { width: "100%", height: 190, borderRadius: 18 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginTop: 22,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitsCount: { fontSize: 12, color: Colors.textMuted },
  empty: { color: Colors.textMutedDark, fontSize: 13 },
    propertyInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  propertyInfoText: { flex: 1, minWidth: 0 },
  propertyInfoName: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  propertyInfoSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: Colors.tealTint,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: Colors.accentTeal },
  unitsList: { gap: 10 },
  unitCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  unitBeds: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unitStatusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  unitStatusText: { fontSize: 10, fontWeight: "600" },
  addUnitLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
  },
  addUnitLinkText: { fontSize: 12, fontWeight: "600", color: Colors.accentOrange },
  unitLabel: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
});