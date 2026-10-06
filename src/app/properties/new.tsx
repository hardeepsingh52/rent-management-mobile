import { useScrollToField } from "@/lib/use-scroll-to-field";
import { FieldError } from "@/components/field-error";
import { FormField } from "@/components/form-field";
import { useFormErrors } from "@/lib/use-form-errors";
import { canadianPostalCode, required, chosen } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { createProperty } from "@/lib/properties-api";
import { usePropertyTypesQuery } from "@/lib/queries";
import { useSession } from "@/lib/session-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type PropertyField =
  "name" | "propertyType" | "line1" | "city" | "region" | "postalCode";

const PROPERTY_SERVER_FIELDS: Record<
  Exclude<PropertyField, "propertyType">,
  RegExp
> = {
  name: /(property )?name/i,
  line1: /line ?1|address/i,
  city: /city/i,
  region: /province|region/i,
  postalCode: /postal/i,
};

function propertyTypeIcon(
  name: string,
): keyof typeof MaterialCommunityIcons.glyphMap {
  const type = name.toLowerCase();
  if (type.includes("condo")) return "domain";
  if (type.includes("duplex")) return "home-group";
  if (type.includes("mobile")) return "home-variant-outline";
  if (
    type.includes("town") ||
    type.includes("apartment") ||
    type.includes("building")
  ) {
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
  const queryClient = useQueryClient();

  const typesQuery = usePropertyTypesQuery();
  const propertyTypes = typesQuery.data;
  const loadError = typesQuery.error?.message ?? null;
  const [pickedTypeId, setPickedTypeId] = useState<number | null>(null);
  // Default to the first type until the user picks one.
  const propertyTypeId = pickedTypeId ?? propertyTypes?.[0]?.id ?? null;

  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { errors, setError, clearError, validate, applyServerErrors } =
    useFormErrors<PropertyField>();
  const { scrollRef, register, scrollToField } =
    useScrollToField<PropertyField>();

  function check(field: PropertyField): string | null {
    switch (field) {
      case "name":
        return required(name, "Property name");
      case "propertyType":
        return chosen(propertyTypeId, "property type");
      case "line1":
        return required(line1, "Address line 1");
      case "city":
        return required(city, "City");
      case "region":
        return required(region, "Province");
      case "postalCode":
        return canadianPostalCode(postalCode);
    }
  }

  async function handleSubmit() {
    const valid = validate(
      {
        name: check("name"),
        propertyType: check("propertyType"),
        line1: check("line1"),
        city: check("city"),
        region: check("region"),
        postalCode: check("postalCode"),
      },
      scrollToField,
    );
    if (!valid || propertyTypeId === null) {
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
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.back();
    } catch (err) {
      setSubmitError(
        applyServerErrors(
          err,
          PROPERTY_SERVER_FIELDS,
          "Failed to add property.",
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

  if (!propertyTypes) {
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
        <Text style={styles.title}>Add Property</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Fill in the details to add a new property.
      </Text>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <FormField
        label="Property name"
        icon="office-building"
        error={errors.name}
        fieldRef={register("name")}
        placeholder="Maple Street Duplex"
        editable={!submitting}
        value={name}
        onChangeText={(text) => {
          setName(text);
          clearError("name");
        }}
        onBlur={() => name.trim() && setError("name", check("name"))}
      />

      <View ref={register("propertyType")}>
        <Text style={styles.label}>Property type</Text>
        <View style={styles.typeGrid}>
          {propertyTypes.map((type) => {
            const selected = propertyTypeId === type.id;
            return (
              <Pressable
                key={type.id}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => {
                  setPickedTypeId(type.id);
                  clearError("propertyType");
                }}
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
        <FieldError message={errors.propertyType} />
      </View>

      <FormField
        label="Address line 1"
        icon="map-marker-outline"
        error={errors.line1}
        fieldRef={register("line1")}
        placeholder="123 Maple St"
        editable={!submitting}
        value={line1}
        onChangeText={(text) => {
          setLine1(text);
          clearError("line1");
        }}
        onBlur={() => line1.trim() && setError("line1", check("line1"))}
      />

      <FormField
        label="Address line 2 (optional)"
        icon="door"
        placeholder="Unit, suite, etc. (optional)"
        editable={!submitting}
        value={line2}
        onChangeText={setLine2}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField
            label="City"
            icon="city-variant-outline"
            error={errors.city}
            fieldRef={register("city")}
            placeholder="Toronto"
            editable={!submitting}
            value={city}
            onChangeText={(text) => {
              setCity(text);
              clearError("city");
            }}
            onBlur={() => city.trim() && setError("city", check("city"))}
          />
        </View>
        <View style={styles.rowItem}>
          <FormField
            label="Province"
            icon="map-outline"
            error={errors.region}
            fieldRef={register("region")}
            placeholder="ON"
            editable={!submitting}
            value={region}
            onChangeText={(text) => {
              setRegion(text);
              clearError("region");
            }}
            onBlur={() => region.trim() && setError("region", check("region"))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField
            label="Postal code"
            icon="email-outline"
            error={errors.postalCode}
            fieldRef={register("postalCode")}
            placeholder="M5V 2T6"
            editable={!submitting}
            value={postalCode}
            onChangeText={(text) => {
              setPostalCode(text);
              clearError("postalCode");
            }}
            onBlur={() =>
              postalCode.trim() && setError("postalCode", check("postalCode"))
            }
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Country</Text>
          <View style={[styles.inputWrapper, styles.inputDisabled]}>
            <MaterialCommunityIcons
              name="earth"
              size={18}
              color={Colors.textMutedDark}
            />
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
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.primaryDark,
  },
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
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    flexShrink: 1,
  },
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
  infoText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
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
