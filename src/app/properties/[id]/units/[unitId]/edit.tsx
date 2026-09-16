import { Colors } from "@/constants/colors";
import { archiveUnit, getProperty, updateUnit } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { UnitType } from "@/lib/types";
import { getUnitStatuses } from "@/lib/unit-statuses-api";
import { getUnitTypes } from "@/lib/unit-types-api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

function unitTypeIcon(
  name: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const type = name.toLowerCase();
  if (type.includes("studio")) return "home-outline";
  if (type.includes("house") || type.includes("full"))
    return "home-city-outline";
  return "door-open";
}

function statusIcon(
  status: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const s = status.toLowerCase();
  if (s === "occupied") return "account-check";
  if (s === "undermaintenance") return "wrench";
  if (s === "listed") return "bullhorn-outline";
  return "door-open";
}

function formatStatus(status: string): string {
  return status.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

export default function EditUnitScreen() {
  const { id, unitId } = useLocalSearchParams<{ id: string; unitId: string }>();
  const router = useRouter();
  const user = useSession();

  const [unitTypes, setUnitTypes] = useState<UnitType[] | null>(null);
  const [statuses, setStatuses] = useState<string[] | null>(null);
  const [unitTypeId, setUnitTypeId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [askingRent, setAskingRent] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    Promise.all([
      getUnitTypes(user.token),
      getUnitStatuses(user.token),
      getProperty(id, user.token),
    ])
      .then(([types, statusList, property]) => {
        const unit = property.units.find((u) => String(u.id) === unitId);
        if (!unit) {
          setLoadError("Unit not found.");
          return;
        }
        setUnitTypes(types);
        setStatuses(statusList);
        setUnitTypeId(
          types.find((t) => t.name === unit.unitType)?.id ??
            types[0]?.id ??
            null,
        );
        setStatus(unit.status);
        setLabel(unit.label);
        setBedrooms(String(unit.bedrooms));
        setBathrooms(String(unit.bathrooms));
        setSquareFeet(String(unit.squareFeet));
        setAskingRent(String(unit.askingRent));
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error ? err.message : "Failed to load unit.",
        ),
      );
  }, [id, unitId, user.token]);

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
    if (!unitTypeId || !status) {
      setSubmitError("Please select a unit type and status.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateUnit(
        unitId,
        {
          unitTypeId,
          label: label.trim(),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          squareFeet: Number(squareFeet),
          askingRent: Number(askingRent),
          status,
        },
        user.token,
      );
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update unit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleArchive() {
    Alert.alert(
      "Archive unit?",
      "This hides the unit from the property's active list. This can't be undone from the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            setArchiving(true);
            try {
              await archiveUnit(unitId, user.token);
              router.replace({ pathname: "/properties/[id]", params: { id } });
            } catch (err) {
              Alert.alert(
                "Couldn't archive unit",
                err instanceof Error ? err.message : "Please try again.",
              );
            } finally {
              setArchiving(false);
            }
          },
        },
      ],
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  if (!unitTypes || !statuses) {
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
        <Text style={styles.title}>Edit Unit</Text>
      </View>
      <Text style={styles.headerSubtitle}>Update the unit's details.</Text>

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
                color={selected ? Colors.accentOrange : Colors.textMuted}
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

      <Text style={styles.label}>Status</Text>
      <View style={styles.typeGrid}>
        {statuses.map((s) => {
          const selected = status === s;
          return (
            <Pressable
              key={s}
              style={[styles.typeCard, selected && styles.typeCardSelected]}
              onPress={() => setStatus(s)}
              disabled={submitting}
            >
              <MaterialCommunityIcons
                name={statusIcon(s)}
                size={18}
                color={selected ? Colors.accentOrange : Colors.textMuted}
              />
              <Text
                style={[styles.typeText, selected && styles.typeTextSelected]}
              >
                {formatStatus(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Label</Text>
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          name="tag-outline"
          size={18}
          color={Colors.textMutedDark}
        />
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
            <MaterialCommunityIcons
              name="bed-outline"
              size={18}
              color={Colors.textMutedDark}
            />
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
            <MaterialCommunityIcons
              name="shower"
              size={18}
              color={Colors.textMutedDark}
            />
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
        <MaterialCommunityIcons
          name="ruler-square"
          size={18}
          color={Colors.textMutedDark}
        />
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
        <MaterialCommunityIcons
          name="cash-multiple"
          size={18}
          color={Colors.textMutedDark}
        />
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
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Save changes</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        style={styles.archiveCard}
        onPress={handleArchive}
        disabled={archiving}
      >
        {archiving ? (
          <ActivityIndicator color={Colors.errorText} />
        ) : (
          <Text style={styles.archiveText}>Archive unit</Text>
        )}
      </Pressable>
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
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.primaryDark,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  typeCardSelected: {
    backgroundColor: Colors.orangeTint,
    borderColor: Colors.accentOrange,
  },
  typeText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  typeTextSelected: { color: Colors.accentOrange },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.accentOrange,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  archiveCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  archiveText: { fontSize: 14, fontWeight: "600", color: Colors.errorText },
});
