import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSession } from "@/lib/session-context";
import { getProperty } from "@/lib/properties-api";
import type { Property, Unit } from "@/lib/types";

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
}

function formatPropertyType(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

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

  const address = [
    property.line1,
    property.line2,
    `${property.city}, ${property.region} ${property.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");

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
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {formatPropertyType(property.propertyType)}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <View style={styles.addressTextWrap}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={Colors.textMuted}
            />
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          </View>
          <Pressable
            style={styles.monthlyPill}
            onPress={() => comingSoon("Date range filter")}
          >
            <Text style={styles.monthlyPillText}>Monthly</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={14}
              color={Colors.textMutedDark}
            />
          </Pressable>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unitsRow}
        >
          {property.units.map((unit: Unit) => (
            <View key={unit.id} style={styles.unitCard}>
              <Text style={styles.unitLabel}>{unit.label}</Text>
              <Text
                style={[
                  styles.unitStatus,
                  { color: unitStatusTint(unit.status) },
                ]}
              >
                {unit.status}
              </Text>
            </View>
          ))}
          <Pressable
            style={styles.addUnitCard}
            onPress={() =>
              router.push({
                pathname: "/properties/[id]/units/new",
                params: { id },
              })
            }
          >
            <MaterialCommunityIcons name="plus" size={18} color={Colors.accentOrange} />
            <Text style={styles.addUnitCardText}>Add Unit</Text>
          </Pressable>
        </ScrollView>
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
    textAlign: "center",
    marginHorizontal: 10,
  },
  photoWrap: { position: "relative" },
  photo: { width: "100%", height: 190, borderRadius: 18 },
  typeBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(22, 48, 43, 0.85)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "600", color: Colors.white },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  addressTextWrap: { flex: 1, flexDirection: "row", gap: 4 },
  addressText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  monthlyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  monthlyPillText: { fontSize: 11, fontWeight: "600", color: Colors.textMutedDark },
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
  unitsRow: { gap: 10, paddingBottom: 4 },
  unitCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    minWidth: 84,
  },
    addUnitCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 84,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.accentOrange,
  },
  addUnitCardText: { fontSize: 11, fontWeight: "600", color: Colors.accentOrange },
  unitLabel: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  unitStatus: { fontSize: 10, fontWeight: "600", marginTop: 4 },
});