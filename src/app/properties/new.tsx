import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "@/lib/session-context";
import { getPropertyTypes } from "@/lib/property-types-api";
import { createProperty } from "@/lib/properties-api";
import type { PropertyType } from "@/lib/types";

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
      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Text style={styles.label}>Property name</Text>
      <TextInput
        style={styles.input}
        placeholder="Maple Street Duplex"
        value={name}
        onChangeText={setName}
        editable={!submitting}
      />

      <Text style={styles.label}>Property type</Text>
      <View style={styles.chipRow}>
        {propertyTypes.map((type) => (
          <Pressable
            key={type.id}
            style={[
              styles.chip,
              propertyTypeId === type.id && styles.chipSelected,
            ]}
            onPress={() => setPropertyTypeId(type.id)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.chipText,
                propertyTypeId === type.id && styles.chipTextSelected,
              ]}
            >
              {type.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Address line 1</Text>
      <TextInput
        style={styles.input}
        placeholder="123 Maple St"
        value={line1}
        onChangeText={setLine1}
        editable={!submitting}
      />

      <Text style={styles.label}>Address line 2</Text>
      <TextInput
        style={styles.input}
        placeholder="Unit, suite, etc. (optional)"
        value={line2}
        onChangeText={setLine2}
        editable={!submitting}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Toronto"
            value={city}
            onChangeText={setCity}
            editable={!submitting}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Province</Text>
          <TextInput
            style={styles.input}
            placeholder="ON"
            value={region}
            onChangeText={setRegion}
            editable={!submitting}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Postal code</Text>
          <TextInput
            style={styles.input}
            placeholder="M5V 2T6"
            value={postalCode}
            onChangeText={setPostalCode}
            editable={!submitting}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Country</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Text style={styles.disabledText}>Canada</Text>
          </View>
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
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDisabled: { backgroundColor: "#f1efe8", justifyContent: "center" },
  disabledText: { fontSize: 14, color: "#5f5e5a" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: "#1565c0", borderColor: "#1565c0" },
  chipText: { fontSize: 13, color: "#111" },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 28 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: "#111" },
  submitButton: {
    flex: 1,
    backgroundColor: "#1565c0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
