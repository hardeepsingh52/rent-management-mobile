import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { getUnitTypes } from "@/lib/unit-types-api";
import { createUnit } from "@/lib/properties-api";
import type { UnitType } from "@/lib/types";

export default function NewUnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useSession();

  const [unitTypes, setUnitTypes] = useState<UnitType[] | null>(null);
  const [unitTypeId, setUnitTypeId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [askingRent, setAskingRent] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getUnitTypes(user.token)
      .then((types) => {
        setUnitTypes(types);
        setUnitTypeId(types[0]?.id ?? null);
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : "Failed to load unit types.",
        ),
      );
  }, [user.token]);

  async function handleSubmit() {
    if (
      !label.trim() ||
      !bedrooms.trim() ||
      !bathrooms.trim() ||
      !squareFeet.trim() ||
      !askingRent.trim()
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    if (!unitTypeId) {
      setSubmitError("Please select a unit type.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createUnit(
        id,
        {
          unitTypeId,
          label: label.trim(),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          squareFeet: Number(squareFeet),
          askingRent: Number(askingRent),
        },
        user.token,
      );
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to add unit.",
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

  if (!unitTypes) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Text style={styles.label}>Unit type</Text>
      <View style={styles.chipRow}>
        {unitTypes.map((type) => (
          <Pressable
            key={type.id}
            style={[styles.chip, unitTypeId === type.id && styles.chipSelected]}
            onPress={() => setUnitTypeId(type.id)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.chipText,
                unitTypeId === type.id && styles.chipTextSelected,
              ]}
            >
              {type.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Label</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 1A, 2B"
        value={label}
        onChangeText={setLabel}
        editable={!submitting}
      />

      <Text style={styles.label}>Bedrooms</Text>
      <TextInput
        style={styles.input}
        placeholder="Number of bedrooms"
        value={bedrooms}
        onChangeText={setBedrooms}
        keyboardType="numeric"
        editable={!submitting}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Bathrooms</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of bathrooms"
            value={bathrooms}
            onChangeText={setBathrooms}
            keyboardType="numeric"
            editable={!submitting}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Square feet</Text>
          <TextInput
            style={styles.input}
            placeholder="1000"
            value={squareFeet}
            onChangeText={setSquareFeet}
            keyboardType="numeric"
            editable={!submitting}
          />
        </View>
      </View>

      <Text style={styles.label}>Asking rent</Text>
      <TextInput
        style={styles.input}
        placeholder="1000"
        value={askingRent}
        onChangeText={setAskingRent}
        keyboardType="numeric"
        editable={!submitting}
      />

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
            <Text style={styles.submitButtonText}>Add unit</Text>
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
