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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSession } from "@/lib/session-context";
import { getUnitTypes } from "@/lib/unit-types-api";
import { createUnit } from "@/lib/properties-api";
import type { UnitType } from "@/lib/types";

function unitTypeIcon(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const type = name.toLowerCase();
  if (type.includes("studio")) return "home-outline";
  if (type.includes("house") || type.includes("full")) return "home-city-outline";
  return "door-open";
}

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
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color="#16302b"
          />
        </Pressable>
        <Text style={styles.title}>Add Unit</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Fill in the details for the new unit.
      </Text>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Text style={styles.label}>Unit type</Text>
      <View style={styles.typeGrid}>
        {unitTypes.map((type) => {
          const selected = unitTypeId === type.id;
          return (
            <Pressable
              key={type.id}
              style={[styles.typeCard, selected && styles.typeCardSelected]}
              onPress={() => setUnitTypeId(type.id)}
              disabled={submitting}
            >
              <MaterialCommunityIcons
                name={unitTypeIcon(type.name)}
                size={18}
                color={selected ? "#d9601f" : "#8a8fa8"}
              />
              <Text
                style={[styles.typeText, selected && styles.typeTextSelected]}
              >
                {type.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Label</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="tag-outline" size={18} color="#5f5e5a" />
        <TextInput
          style={styles.input}
          placeholder="e.g. 1A, 2B"
          value={label}
          onChangeText={setLabel}
          editable={!submitting}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Bedrooms</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="bed-outline" size={18} color="#5f5e5a" />
            <TextInput
              style={styles.input}
              placeholder="2"
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="numeric"
              editable={!submitting}
            />
          </View>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Bathrooms</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="shower" size={18} color="#5f5e5a" />
            <TextInput
              style={styles.input}
              placeholder="1"
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="numeric"
              editable={!submitting}
            />
          </View>
        </View>
      </View>

      <Text style={styles.label}>Square feet</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="ruler-square" size={18} color="#5f5e5a" />
        <TextInput
          style={styles.input}
          placeholder="850"
          value={squareFeet}
          onChangeText={setSquareFeet}
          keyboardType="numeric"
          editable={!submitting}
        />
      </View>

      <Text style={styles.label}>Asking rent (monthly)</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons name="cash-multiple" size={18} color="#5f5e5a" />
        <TextInput
          style={styles.input}
          placeholder="1500"
          value={askingRent}
          onChangeText={setAskingRent}
          keyboardType="numeric"
          editable={!submitting}
        />
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
            <Text style={styles.submitButtonText}>Add unit</Text>
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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#16302b" },
  headerSubtitle: {
    fontSize: 12,
    color: "#8a8fa8",
    marginTop: 6,
    marginLeft: 50,
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
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: "#16302b" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  typeCardSelected: {
    backgroundColor: "#fdece0",
    borderColor: "#d9601f",
  },
  typeText: { fontSize: 13, fontWeight: "600", color: "#8a8fa8" },
  typeTextSelected: { color: "#d9601f" },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: "#16302b" },
  submitButton: {
    flex: 1,
    backgroundColor: "#d9601f",
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});