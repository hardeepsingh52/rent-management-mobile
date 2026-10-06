import { useScrollToField } from "@/lib/use-scroll-to-field";
import { FieldError } from "@/components/field-error";
import { FormField } from "@/components/form-field";
import { useFormErrors } from "@/lib/use-form-errors";
import { number, required, chosen } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import type { Unit, UnitType } from "@/lib/types";
import { archiveUnit, updateUnit } from "@/lib/properties-api";
import {
  usePropertyQuery,
  useUnitStatusesQuery,
  useUnitTypesQuery,
} from "@/lib/queries";
import { useSession } from "@/lib/session-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

type UnitField =
  | "label"
  | "unitType"
  | "status"
  | "bedrooms"
  | "bathrooms"
  | "squareFeet"
  | "askingRent";

const UNIT_SERVER_FIELDS: Record<UnitField, RegExp> = {
  unitType: /unit ?type/i,
  status: /status/i,
  label: /label/i,
  bedrooms: /bedroom/i,
  bathrooms: /bathroom/i,
  squareFeet: /square ?feet|sqft/i,
  askingRent: /rent/i,
};

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
  const typesQuery = useUnitTypesQuery();
  const statusesQuery = useUnitStatusesQuery();
  const propertyQuery = usePropertyQuery(id);
  const unit = propertyQuery.data?.units.find((u) => String(u.id) === unitId);
  const loadError =
    (typesQuery.error ?? statusesQuery.error ?? propertyQuery.error)?.message ??
    (propertyQuery.data && !unit ? "Unit not found." : null);

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  if (!typesQuery.data || !statusesQuery.data || !unit) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <EditUnitForm
      id={id}
      unitId={unitId}
      unit={unit}
      unitTypes={typesQuery.data}
      statuses={statusesQuery.data}
    />
  );
}

// Rendered only once the data has loaded, so the form fields can start with the
// saved values instead of being filled in by an effect.
function EditUnitForm({
  id,
  unitId,
  unit,
  unitTypes,
  statuses,
}: {
  id: string;
  unitId: string;
  unit: Unit;
  unitTypes: UnitType[];
  statuses: string[];
}) {
  const router = useRouter();
  const user = useSession();
  const queryClient = useQueryClient();

  const [unitTypeId, setUnitTypeId] = useState<number | null>(
    unitTypes.find((t) => t.name === unit.unitType)?.id ??
      unitTypes[0]?.id ??
      null,
  );
  const [status, setStatus] = useState<string | null>(unit.status);

  const [label, setLabel] = useState(unit.label);
  const [bedrooms, setBedrooms] = useState(String(unit.bedrooms));
  const [bathrooms, setBathrooms] = useState(String(unit.bathrooms));
  const [squareFeet, setSquareFeet] = useState(String(unit.squareFeet));
  const [askingRent, setAskingRent] = useState(String(unit.askingRent));

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const { errors, setError, clearError, validate, applyServerErrors } =
    useFormErrors<UnitField>();
  const { scrollRef, register, scrollToField } = useScrollToField<UnitField>();

  function check(field: UnitField): string | null {
    switch (field) {
      case "label":
        return required(label, "Label");
      case "unitType":
        return chosen(unitTypeId, "unit type");
      case "status":
        return chosen(status, "status");
      case "bedrooms":
        return number(bedrooms, "Bedrooms", { integer: true });
      case "bathrooms":
        return number(bathrooms, "Bathrooms");
      case "squareFeet":
        return number(squareFeet, "Square feet", { min: 1 });
      case "askingRent":
        return number(askingRent, "Asking rent", { min: 1 });
    }
  }

  async function handleSubmit() {
    const valid = validate(
      {
        unitType: check("unitType"),
        status: check("status"),
        label: check("label"),
        bedrooms: check("bedrooms"),
        bathrooms: check("bathrooms"),
        squareFeet: check("squareFeet"),
        askingRent: check("askingRent"),
      },
      scrollToField,
    );
    if (!valid || unitTypeId === null || status === null) {
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
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.back();
    } catch (err) {
      setSubmitError(
        applyServerErrors(
          err,
          UNIT_SERVER_FIELDS,
          "Failed to update unit.",
          scrollToField,
        ),
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
              queryClient.invalidateQueries({ queryKey: ["properties"] });
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

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
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

      <View ref={register("unitType")}>
        <Text style={styles.label}>Unit type</Text>
        <View style={styles.typeGrid}>
          {unitTypes.map((type) => {
            const selected = unitTypeId === type.id;
            return (
              <Pressable
                key={type.id}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => {
                  setUnitTypeId(type.id);
                  clearError("unitType");
                }}
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
        <FieldError message={errors.unitType} />
      </View>

      <View ref={register("status")}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.typeGrid}>
          {statuses.map((s) => {
            const selected = status === s;
            return (
              <Pressable
                key={s}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => {
                  setStatus(s);
                  clearError("status");
                }}
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
        <FieldError message={errors.status} />
      </View>

      <FormField
        label="Label"
        icon="tag-outline"
        error={errors.label}
        fieldRef={register("label")}
        placeholder="e.g. 1A, 2B"
        editable={!submitting}
        value={label}
        onChangeText={(text) => {
          setLabel(text);
          clearError("label");
        }}
        onBlur={() => label.trim() && setError("label", check("label"))}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField
            label="Bedrooms"
            icon="bed-outline"
            error={errors.bedrooms}
            fieldRef={register("bedrooms")}
            placeholder="2"
            keyboardType="numeric"
            editable={!submitting}
            value={bedrooms}
            onChangeText={(text) => {
              setBedrooms(text);
              clearError("bedrooms");
            }}
            onBlur={() =>
              bedrooms.trim() && setError("bedrooms", check("bedrooms"))
            }
          />
        </View>
        <View style={styles.rowItem}>
          <FormField
            label="Bathrooms"
            icon="shower"
            error={errors.bathrooms}
            fieldRef={register("bathrooms")}
            placeholder="1"
            keyboardType="numeric"
            editable={!submitting}
            value={bathrooms}
            onChangeText={(text) => {
              setBathrooms(text);
              clearError("bathrooms");
            }}
            onBlur={() =>
              bathrooms.trim() && setError("bathrooms", check("bathrooms"))
            }
          />
        </View>
      </View>

      <FormField
        label="Square feet"
        icon="ruler-square"
        error={errors.squareFeet}
        fieldRef={register("squareFeet")}
        placeholder="850"
        keyboardType="numeric"
        editable={!submitting}
        value={squareFeet}
        onChangeText={(text) => {
          setSquareFeet(text);
          clearError("squareFeet");
        }}
        onBlur={() =>
          squareFeet.trim() && setError("squareFeet", check("squareFeet"))
        }
      />

      <FormField
        label="Asking rent (monthly)"
        icon="cash-multiple"
        error={errors.askingRent}
        fieldRef={register("askingRent")}
        placeholder="1500"
        keyboardType="numeric"
        editable={!submitting}
        value={askingRent}
        onChangeText={(text) => {
          setAskingRent(text);
          clearError("askingRent");
        }}
        onBlur={() =>
          askingRent.trim() && setError("askingRent", check("askingRent"))
        }
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
