import { FieldError, fieldErrorBorder } from "@/components/field-error";
import { Colors } from "@/constants/colors";
import { usePropertiesQuery } from "@/lib/queries";
import { useFormErrors } from "@/lib/use-form-errors";
import { useScrollToField } from "@/lib/use-scroll-to-field";
import { chosen, email as validateEmail } from "@/lib/validators";
import { useSession } from "@/lib/session-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import {
  createTenantInvite,
  getMyTenantInvites,
  getTenantInviteStats,
  resendTenantInvite,
} from "@/lib/tenant-invite-api";

import type { TenantInviteListItem, TenantInviteStatus } from "@/lib/types";

const STATUS_COLORS: Record<TenantInviteStatus, { bg: string; text: string }> =
  {
    Pending: { bg: Colors.orangeTint, text: Colors.accentOrange },
    Accepted: { bg: Colors.tealTint, text: Colors.accentTeal },
    Declined: { bg: Colors.errorBg, text: Colors.errorText },
    Expired: { bg: Colors.divider, text: Colors.textMuted },
  };

type InviteField = "email" | "unit";

const SERVER_FIELDS: Record<InviteField, RegExp> = {
  email: /email/i,
  unit: /unit/i,
};

export default function TenantsScreen() {
  const user = useSession();
  const router = useRouter();

  const queryClient = useQueryClient();

  const propertiesQuery = usePropertiesQuery();
  const invitesQuery = useQuery({
    queryKey: ["tenant-invites", user.id, "list"],
    queryFn: () => getMyTenantInvites(user.token),
    staleTime: 0,
  });
  const statsQuery = useQuery({
    queryKey: ["tenant-invites", user.id, "stats"],
    queryFn: () => getTenantInviteStats(user.token),
    staleTime: 0,
  });
  const properties = propertiesQuery.data;
  const invites = invitesQuery.data;
  const stats = statsQuery.data;
  const loadError =
    (propertiesQuery.error ?? invitesQuery.error ?? statsQuery.error)
      ?.message ?? null;
  const { refetch: refetchInvites } = invitesQuery;
  const { refetch: refetchStats } = statsQuery;

  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Default to the first unit until the user picks one.
  const selectedUnitId =
    unitId ?? properties?.flatMap((p) => p.units)[0]?.id ?? null;

  // Tab screens stay mounted, so refresh invites when the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      refetchInvites();
      refetchStats();
    }, [refetchInvites, refetchStats]),
  );

  const { errors, setError, clearError, validate, applyServerErrors } =
    useFormErrors<InviteField>();
  const { scrollRef, register, scrollToField } =
    useScrollToField<InviteField>();

  async function handleSubmit() {
    const valid = validate(
      {
        email: validateEmail(email),
        unit: chosen(selectedUnitId, "unit"),
      },
      scrollToField,
    );
    if (!valid || selectedUnitId === null) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await createTenantInvite(email.trim(), selectedUnitId, user.token);
      setSentEmail(email.trim());
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["tenant-invites"] });
    } catch (err) {
      setSubmitError(
        applyServerErrors(
          err,
          SERVER_FIELDS,
          "Couldn't send invite. Please try again.",
          scrollToField,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend(invite: TenantInviteListItem) {
    setSubmitError(null);
    setResendingId(invite.id);
    try {
      await resendTenantInvite(invite.id, user.token);
      setSentEmail(invite.email);
      await queryClient.invalidateQueries({ queryKey: ["tenant-invites"] });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Couldn't resend invite.",
      );
    } finally {
      setResendingId(null);
    }
  }

  const hasUnits = (properties ?? []).some((p) => p.units.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tenants</Text>
        <Text style={styles.subtitle}>
          Send an invite so a tenant can access their unit.
        </Text>

        {sentEmail && (
          <Text style={styles.success}>Invite sent to {sentEmail}.</Text>
        )}
        {submitError && <Text style={styles.error}>{submitError}</Text>}
        {loadError && <Text style={styles.error}>{loadError}</Text>}

        {propertiesQuery.isPending && !loadError && (
          <ActivityIndicator style={{ marginTop: 20 }} />
        )}

        {properties && !hasUnits && (
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

        {properties && hasUnits && (
          <View style={styles.card}>
            <View ref={register("email")}>
              <Text style={styles.label}>Tenant&apos;s email</Text>
              <View
                style={[styles.inputWrapper, errors.email && fieldErrorBorder]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={Colors.textMutedDark}
                />
                <TextInput
                  style={styles.input}
                  placeholder="tenant@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError("email");
                  }}
                  onBlur={() =>
                    email.trim() && setError("email", validateEmail(email))
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!submitting}
                />
              </View>
              <FieldError message={errors.email} />
            </View>

            <View ref={register("unit")}>
              <Text style={styles.label}>Unit</Text>
              {properties.map((property) =>
                property.units.length > 0 ? (
                  <View key={property.id} style={styles.propertyGroup}>
                    <Text style={styles.propertyName}>{property.name}</Text>
                    <View style={styles.unitGrid}>
                      {property.units.map((unit) => {
                        const selected = selectedUnitId === unit.id;
                        return (
                          <Pressable
                            key={unit.id}
                            style={[
                              styles.unitChip,
                              selected && styles.unitChipSelected,
                            ]}
                            onPress={() => {
                              setUnitId(unit.id);
                              clearError("unit");
                            }}
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
              <FieldError message={errors.unit} />
            </View>

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

        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: Colors.white }]}>
              <Text style={[styles.statText, { color: Colors.primaryDark }]}>
                {stats.sent} sent
              </Text>
            </View>
            {(
              [
                ["Pending", stats.pending],
                ["Accepted", stats.accepted],
                ["Declined", stats.declined],
                ["Expired", stats.expired],
              ] as [TenantInviteStatus, number][]
            ).map(([status, count]) => (
              <View
                key={status}
                style={[
                  styles.statChip,
                  { backgroundColor: STATUS_COLORS[status].bg },
                ]}
              >
                <Text
                  style={[
                    styles.statText,
                    { color: STATUS_COLORS[status].text },
                  ]}
                >
                  {count} {status.toLowerCase()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {invites && invites.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sent invites</Text>
            {invites.map((invite) => {
              const canResend =
                invite.status === "Pending" || invite.status === "Expired";
              return (
                <View key={invite.id} style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inviteEmail}>{invite.email}</Text>
                    <Text style={styles.inviteMeta}>
                      {invite.propertyName} · {invite.unitLabel}
                    </Text>
                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: STATUS_COLORS[invite.status].bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: STATUS_COLORS[invite.status].text },
                          ]}
                        >
                          {invite.status}
                        </Text>
                      </View>
                      <Text style={styles.inviteMeta}>
                        {invite.status === "Pending" ? "expires" : "expired"}{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {canResend && (
                    <Pressable
                      style={styles.resendButton}
                      onPress={() => handleResend(invite)}
                      disabled={resendingId === invite.id}
                    >
                      {resendingId === invite.id ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Text style={styles.resendButtonText}>Resend</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}
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
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 },
  statChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statText: { fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  inviteEmail: { fontSize: 13, fontWeight: "600", color: Colors.primaryDark },
  inviteMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resendButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.orangeTint,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accentOrange,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
});
