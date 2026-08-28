import { createProperty } from "@/lib/properties-api";
import { getPropertyTypes } from "@/lib/property-types-api";
import { useSession } from "@/lib/session-context";
import type { PropertyType } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TypeVisual = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  accent: string;
};

function getPropertyTypeVisual(name: string): TypeVisual {
  const type = name.toLowerCase();
  if (type.includes("condo")) {
    return { icon: "domain", tint: "#fdece0", accent: "#d9601f" };
  }
  if (type.includes("duplex")) {
    return { icon: "home-group", tint: "#efe7fb", accent: "#7c4dff" };
  }
  if (type.includes("mobile")) {
    return { icon: "home-variant-outline", tint: "#e3f0fc", accent: "#1f6fd9" };
  }
  if (type.includes("town")) {
    return { icon: "office-building", tint: "#fdece0", accent: "#d9601f" };
  }
  if (type.includes("apartment") || type.includes("building")) {
    return { icon: "office-building", tint: "#dff5f2", accent: "#2f8a75" };
  }
  return { icon: "home-outline", tint: "#dff5f2", accent: "#2f8a75" };
}

function formatPropertyType(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function FieldIcon({
  name,
  color,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.fieldIcon, { backgroundColor: color + "22" }]}>
      <MaterialCommunityIcons name={name} size={13} color={color} />
    </View>
  );
}

export default function NewPropertyScreen() {
  const router = useRouter();
  const user = useSession();

  const [propertyTypes, setPropertyTypes] = useState<PropertyType[] | null>(
    null,
  );
  const [propertyTypeId, setPropertyTypeId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPropertyTypes(user.token)
      .then((types) => {
        setPropertyTypes(types);
        setPropertyTypeId(types[0]?.id ?? null);
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : "Failed to load property types.",
        ),
      );
  }, [user.token]);

  async function handleSubmit() {
    if (
      !name.trim() ||
      !line1.trim() ||
      !city.trim() ||
      !region.trim() ||
      !postalCode.trim()
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (!propertyTypeId) {
      setSubmitError("Please select a property type.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createProperty(
        {
          name: name.trim(),
          propertyTypeId,
          line1: line1.trim(),
          line2: line2.trim() === "" ? null : line2.trim(),
          city: city.trim(),
          region: region.trim(),
          postalCode: postalCode.trim(),
          country: "Canada",
        },
        user.token,
      );
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to add property.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  if (!propertyTypes) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color="#16302b"
          />
        </Pressable>
        <Text style={styles.title}>Add property</Text>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="home-plus-outline"
            size={20}
            color="#2f8a75"
          />
        </View>
      </View>
      <Text style={styles.headerSubtitle}>
        Fill in the details to add a new property.
      </Text>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Text style={styles.label}>Property name</Text>
      <View style={styles.inputWrapper}>
        <FieldIcon name="office-building" color="#2f8a75" />
        <TextInput
          style={styles.input}
          placeholder="Maple Street Duplex"
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />
      </View>

      <Text style={styles.label}>Property type</Text>
      <View style={styles.typeGrid}>
        {propertyTypes.map((type) => {
          const visual = getPropertyTypeVisual(type.name);
          const selected = propertyTypeId === type.id;
          return (
            <Pressable
              key={type.id}
              style={[
                styles.typeCard,
                { backgroundColor: visual.tint },
                selected && { borderColor: visual.accent },
              ]}
              onPress={() => setPropertyTypeId(type.id)}
              disabled={submitting}
            >
              <View style={styles.typeIcon}>
                <MaterialCommunityIcons
                  name={visual.icon}
                  size={13}
                  color={visual.accent}
                />
              </View>
              <Text style={[styles.typeText, { color: visual.accent }]}>
                {formatPropertyType(type.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Address line 1</Text>
      <View style={styles.inputWrapper}>
        <FieldIcon name="map-marker-outline" color="#2f8a75" />
        <TextInput
          style={styles.input}
          placeholder="123 Maple St"
          value={line1}
          onChangeText={setLine1}
          editable={!submitting}
        />
      </View>

      <Text style={styles.label}>Address line 2 (optional)</Text>
      <View style={styles.inputWrapper}>
        <FieldIcon name="door" color="#2f8a75" />
        <TextInput
          style={styles.input}
          placeholder="Unit, suite, etc. (optional)"
          value={line2}
          onChangeText={setLine2}
          editable={!submitting}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>City</Text>
          <View style={styles.inputWrapper}>
            <FieldIcon name="city-variant-outline" color="#2f8a75" />
            <TextInput
              style={styles.input}
              placeholder="Toronto"
              value={city}
              onChangeText={setCity}
              editable={!submitting}
            />
          </View>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Province</Text>
          <View style={styles.inputWrapper}>
            <FieldIcon name="map-outline" color="#2f8a75" />
            <TextInput
              style={styles.input}
              placeholder="ON"
              value={region}
              onChangeText={setRegion}
              editable={!submitting}
            />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Postal code</Text>
          <View style={styles.inputWrapper}>
            <FieldIcon name="email-outline" color="#2f8a75" />
            <TextInput
              style={styles.input}
              placeholder="M5V 2T6"
              value={postalCode}
              onChangeText={setPostalCode}
              editable={!submitting}
            />
          </View>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Country</Text>
          <View style={[styles.inputWrapper, styles.inputDisabled]}>
            <FieldIcon name="earth" color="#2f8a75" />
            <Text style={styles.disabledText}>Canada</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <View style={styles.infoIcon}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={15}
            color="#2f8a75"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Double check your details</Text>
          <Text style={styles.infoText}>
            Make sure the address is correct to manage your property easily.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add property</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6fa",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 20, fontWeight: "700", color: "#16302b" },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dff5f2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8a8fa8",
    marginTop: 6,
    marginLeft: 44,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16302b",
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fieldIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: { flex: 1, paddingVertical: 8, fontSize: 14, color: "#16302b" },
  inputDisabled: {},
  disabledText: { fontSize: 14, color: "#8a8fa8" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: { fontSize: 11, fontWeight: "600", flexShrink: 1 },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#dff5f2",
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 12, fontWeight: "700", color: "#0f4a42" },
  infoText: { fontSize: 10, color: "#0f4a42", marginTop: 2, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 13, fontWeight: "600", color: "#16302b" },
  submitButton: {
    flex: 1,
    backgroundColor: "#16302b",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
