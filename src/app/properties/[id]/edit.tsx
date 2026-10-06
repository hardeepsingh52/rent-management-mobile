import { useScrollToField } from "@/lib/use-scroll-to-field";
import { FieldError } from "@/components/field-error";
import { FormField } from "@/components/form-field";
import { useFormErrors } from "@/lib/use-form-errors";
import { canadianPostalCode, required, chosen } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import type { Property, PropertyType } from "@/lib/types";
import { archiveProperty, updateProperty } from "@/lib/properties-api";
import { usePropertyQuery, usePropertyTypesQuery } from "@/lib/queries";
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

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const typesQuery = usePropertyTypesQuery();
  const propertyQuery = usePropertyQuery(id);
  const loadError = (typesQuery.error ?? propertyQuery.error)?.message ?? null;

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }

  if (!typesQuery.data || !propertyQuery.data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <EditPropertyForm
      id={id}
      property={propertyQuery.data}
      propertyTypes={typesQuery.data}
    />
  );
}

// Rendered only once the data has loaded, so the form fields can start with the
// saved values instead of being filled in by an effect.
function EditPropertyForm({
  id,
  property,
  propertyTypes,
}: {
  id: string;
  property: Property;
  propertyTypes: PropertyType[];
}) {
  const router = useRouter();
  const user = useSession();
  const queryClient = useQueryClient();

  const [propertyTypeId, setPropertyTypeId] = useState<number | null>(
    propertyTypes.find((t) => t.name === property.propertyType)?.id ??
      propertyTypes[0]?.id ??
      null,
  );

  const [name, setName] = useState(property.name);
  const [line1, setLine1] = useState(property.line1);
  const [line2, setLine2] = useState(property.line2 ?? "");
  const [city, setCity] = useState(property.city);
  const [region, setRegion] = useState(property.region);
  const [postalCode, setPostalCode] = useState(property.postalCode);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

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
      await updateProperty(
        id,
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
          "Failed to update property.",
          scrollToField,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleArchive() {
    Alert.alert(
      "Archive property?",
      "This hides the property from your active list. This can't be undone from the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            setArchiving(true);
            try {
              await archiveProperty(id, user.token);
              queryClient.invalidateQueries({ queryKey: ["properties"] });
              router.replace("/(tabs)/properties");
            } catch (err) {
              Alert.alert(
                "Couldn't archive property",
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
        <Text style={styles.title}>Edit Property</Text>
      </View>
      <Text style={styles.headerSubtitle}>Update the property's details.</Text>

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
                  setPropertyTypeId(type.id);
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
          <Text style={styles.archiveText}>Archive property</Text>
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
  archiveCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  archiveText: { fontSize: 14, fontWeight: "600", color: Colors.errorText },
});
