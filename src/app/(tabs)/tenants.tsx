import { Colors } from "@/constants/colors";
import { getMyProperties } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import { createTenantInvite } from "@/lib/tenant-invite-api";
import type { Property } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TenantsScreen() {
  const user = useSession();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await getMyProperties(user.token);
      setProperties(data);
      setUnitId(
        (current) => current ?? data.flatMap((p) => p.units)[0]?.id ?? null,
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load properties.",
      );
    }
  }, [user.token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSubmit() {
    if (!email.trim()) {
      setSubmitError("Please enter the tenant's email.");
      return;
    }
    if (!unitId) {
      setSubmitError("Please select a unit.");
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createTenantInvite(email.trim(), unitId, user.token);
      setSentEmail(email.trim());
      setEmail("");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Couldn't send invite. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasUnits = (properties ?? []).some((p) => p.units.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tenants</Text>
        <Text style={styles.subtitle}>
          Send an invite so a tenant can access their unit.
        </Text>

        {sentEmail && (
          <Text style={styles.success}>Invite sent to {sentEmail}.</Text>
        )}
        {submitError && <Text style={styles.error}>{submitError}</Text>}
        {loadError && <Text style={styles.error}>{loadError}</Text>}

        {properties === null && !loadError && (
          <ActivityIndicator style={{ marginTop: 20 }} />
        )}

        {properties !== null && !hasUnits && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Add a property and unit before inviting a tenant.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/properties/new")}
            >
              <Text style={styles.emptyButtonText}>Add property</Text>
            </Pressable>
          </View>
        )}

        {properties !== null && hasUnits && (
          <View style={styles.card}>
            <Text style={styles.label}>Tenant&apos;s email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={Colors.textMutedDark}
              />
              <TextInput
                style={styles.input}
                placeholder="tenant@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!submitting}
              />
            </View>

            <Text style={styles.label}>Unit</Text>
            {properties.map((property) =>
              property.units.length > 0 ? (
                <View key={property.id} style={styles.propertyGroup}>
                  <Text style={styles.propertyName}>{property.name}</Text>
                  <View style={styles.unitGrid}>
                    {property.units.map((unit) => {
                      const selected = unitId === unit.id;
                      return (
                        <Pressable
                          key={unit.id}
                          style={[
                            styles.unitChip,
                            selected && styles.unitChipSelected,
                          ]}
                          onPress={() => setUnitId(unit.id)}
                          disabled={submitting}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              selected && styles.unitChipTextSelected,
                            ]}
                          >
                            {unit.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null,
            )}

            <Pressable
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Send invite</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  success: {
    backgroundColor: Colors.tealTint,
    color: Colors.accentTeal,
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: "center",
  },
  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: "center" },
  emptyButton: {
    backgroundColor: Colors.accentOrange,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 14,
  },
  emptyButtonText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.primaryDark,
  },
  propertyGroup: { marginTop: 8 },
  propertyName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    marginBottom: 6,
  },
  unitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitChip: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  unitChipSelected: {
    backgroundColor: Colors.orangeTint,
    borderColor: Colors.accentOrange,
  },
  unitChipText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  unitChipTextSelected: { color: Colors.accentOrange },
  submitButton: {
    backgroundColor: Colors.accentOrange,
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});
