import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSession } from "@/lib/session-context";
import { getProperty } from "@/lib/properties-api";
import type { Property } from "@/lib/types";

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{property.name}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{property.propertyType}</Text>
      </View>

      <Text style={styles.sectionLabel}>Address</Text>
      <Text style={styles.address}>
        {property.line1}
        {property.line2 ? `, ${property.line2}` : ""}
      </Text>
      <Text style={styles.address}>
        {property.city}, {property.region} {property.postalCode}
      </Text>
      <Text style={styles.addressMuted}>{property.country}</Text>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabelInRow}>Units</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/properties/[id]/units/new",
              params: { id },
            })
          }
        >
          <Text style={styles.addUnitLink}>+ Add unit</Text>
        </Pressable>
      </View>
      {property.units.length === 0 ? (
        <Text style={styles.muted}>No units yet.</Text>
      ) : (
        property.units.map((unit) => (
          <View key={unit.id} style={styles.unitCard}>
            <View style={styles.unitTop}>
              <Text style={styles.unitLabel}>{unit.label}</Text>
              <View style={styles.unitStatusBadge}>
                <Text style={styles.unitStatusText}>{unit.status}</Text>
              </View>
            </View>
            <Text style={styles.muted}>{unit.unitType}</Text>
            <Text style={styles.unitMeta}>
              {unit.bedrooms} bd &middot; {unit.bathrooms} ba &middot;{" "}
              {unit.squareFeet} sqft
            </Text>
            <Text style={styles.unitRent}>
              ${unit.askingRent.toLocaleString()}/mo
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  error: { color: "#b91c1c", fontSize: 14 },
  name: { fontSize: 20, fontWeight: "600", color: "#111" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e6f1fb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#1565c0" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5f5e5a",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  address: { fontSize: 14, color: "#111" },
  addressMuted: { fontSize: 13, color: "#5f5e5a", marginTop: 2 },
  muted: { fontSize: 13, color: "#5f5e5a" },
  unitCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  unitTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitLabel: { fontSize: 14, fontWeight: "600", color: "#111" },
  unitStatusBadge: {
    backgroundColor: "#e7faf1",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  sectionLabelInRow: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5f5e5a",
    textTransform: "uppercase",
  },
  addUnitLink: { fontSize: 13, fontWeight: "600", color: "#1565c0" },
  unitStatusText: { fontSize: 11, fontWeight: "500", color: "#0f8a5f" },
  unitMeta: { fontSize: 13, color: "#111" },
  unitRent: { fontSize: 13, fontWeight: "600", color: "#111" },
});
