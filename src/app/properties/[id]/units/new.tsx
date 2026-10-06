import { useScrollToField } from "@/lib/use-scroll-to-field";
import { FieldError } from "@/components/field-error";
import { FormField } from "@/components/form-field";
import { useFormErrors } from "@/lib/use-form-errors";
import { number, required, chosen } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useSession } from "@/lib/session-context";
import { useUnitTypesQuery } from "@/lib/queries";
import { createUnit } from "@/lib/properties-api";

type UnitField =
  "label" | "unitType" | "bedrooms" | "bathrooms" | "squareFeet" | "askingRent";

const UNIT_SERVER_FIELDS: Record<Exclude<UnitField, "status">, RegExp> = {
  unitType: /unit ?type/i,
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

export default function NewUnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useSession();
  const queryClient = useQueryClient();

  const typesQuery = useUnitTypesQuery();
  const unitTypes = typesQuery.data;
  const loadError = typesQuery.error?.message ?? null;
  const [pickedTypeId, setPickedTypeId] = useState<number | null>(null);
  // Default to the first type until the user picks one.
  const unitTypeId = pickedTypeId ?? unitTypes?.[0]?.id ?? null;

  const [label, setLabel] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [askingRent, setAskingRent] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { errors, setError, clearError, validate, applyServerErrors } =
    useFormErrors<UnitField>();
  const { scrollRef, register, scrollToField } = useScrollToField<UnitField>();

  function check(field: UnitField): string | null {
    switch (field) {
      case "label":
        return required(label, "Label");
      case "unitType":
        return chosen(unitTypeId, "unit type");
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
        label: check("label"),
        bedrooms: check("bedrooms"),
        bathrooms: check("bathrooms"),
        squareFeet: check("squareFeet"),
        askingRent: check("askingRent"),
      },
      scrollToField,
    );
    if (!valid || unitTypeId === null) {
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
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.back();
    } catch (err) {
      setSubmitError(
        applyServerErrors(
          err,
          UNIT_SERVER_FIELDS,
          "Failed to add unit.",
          scrollToField,
        ),
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
        <Text style={styles.title}>Add Unit</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Fill in the details for the new unit.
      </Text>

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
                  setPickedTypeId(type.id);
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
            <Text style={styles.submitButtonText}>Add unit</Text>
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
});
