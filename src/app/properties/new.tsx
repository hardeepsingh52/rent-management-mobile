import { Colors } from "@/constants/colors";
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

function propertyTypeIcon(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const type = name.toLowerCase();
  if (type.includes("condo")) return "domain";
  if (type.includes("duplex")) return "home-group";
  if (type.includes("mobile")) return "home-variant-outline";
  if (type.includes("town") || type.includes("apartment") || type.includes("building")) {
    return "office-building";
  }
  return "home-outline";
}

function formatPropertyType(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
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
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={Colors.primaryDark}
          />
        </Pressable>
        <Text style={styles.title}>Add Property</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Fill in the details to add a new property.
      </Text>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Text style={styles.label}>Property name</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          name="office-building"
          size={18}
          color={Colors.textMutedDark}
        />
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
          const selected = propertyTypeId === type.id;
          return (
            <Pressable
              key={type.id}
              style={[styles.typeCard, selected && styles.typeCardSelected]}
              onPress={() => setPropertyTypeId(type.id)}
              disabled={submitting}
            >
              <MaterialCommunityIcons
                name={propertyTypeIcon(type.name)}
                size={18}
                color={selected ? Colors.accentOrange : Colors.textMuted}
              />
              <Text
                style={[styles.typeText, selected && styles.typeTextSelected]}
              >
                {formatPropertyType(type.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Address line 1</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={18}
          color={Colors.textMutedDark}
        />
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
        <MaterialCommunityIcons name="door" size={18} color={Colors.textMutedDark} />
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
            <MaterialCommunityIcons
              name="city-variant-outline"
              size={18}
              color={Colors.textMutedDark}
            />
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
            <MaterialCommunityIcons
              name="map-outline"
              size={18}
              color={Colors.textMutedDark}
            />
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
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={Colors.textMutedDark}
            />
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
            <MaterialCommunityIcons name="earth" size={18} color={Colors.textMutedDark} />
            <Text style={styles.disabledText}>Canada</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={Colors.accentOrange}
        />
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
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add property</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  error: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    marginLeft: 50,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginBottom: 6,
    marginTop: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: Colors.primaryDark },
  inputDisabled: {},
  disabledText: { fontSize: 14, color: Colors.textMuted, paddingVertical: 13 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  typeCardSelected: {
    backgroundColor: Colors.orangeTint,
    borderColor: Colors.accentOrange,
  },
  typeText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted, flexShrink: 1 },
  typeTextSelected: { color: Colors.accentOrange },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },
  infoTitle: { fontSize: 12, fontWeight: "700", color: Colors.primaryDark },
  infoText: { fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 15 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: Colors.primaryDark },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.accentOrange,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});