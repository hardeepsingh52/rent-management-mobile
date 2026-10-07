import { Colors } from "@/constants/colors";
import { useMyTenanciesQuery, useUnreadCountQuery } from "@/lib/queries";
import { useSession } from "@/lib/session-context";
import { SAMPLE_TENANCIES } from "@/lib/tenant-api";
import type { TenantTenancy } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRent(rent: number | null): string {
  return rent === null ? "—" : `$${rent.toLocaleString()}/mo`;
}

function TenancyCard({ tenancy }: { tenancy: TenantTenancy }) {
  const { unit, property, landlord } = tenancy;
  const address = [property.line1, property.line2].filter(Boolean).join(", ");
  const facts = [
    unit.bedrooms !== null ? `${unit.bedrooms} bed` : null,
    unit.bathrooms !== null ? `${unit.bathrooms} bath` : null,
    unit.squareFeet !== null ? `${unit.squareFeet} sq ft` : null,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.unitLabel}>{unit.label}</Text>
        </View>
        <View
          style={[
            styles.badge,
            tenancy.status === "Active" ? styles.badgeActive : styles.badgeEnded,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              tenancy.status === "Active"
                ? styles.badgeTextActive
                : styles.badgeTextEnded,
            ]}
          >
            {tenancy.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={18}
          color={Colors.textMutedDark}
        />
        <Text style={styles.infoText}>
          {address}, {property.city}, {property.region} {property.postalCode}
        </Text>
      </View>

      {facts.length > 0 && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="bed-outline"
            size={18}
            color={Colors.textMutedDark}
          />
          <Text style={styles.infoText}>{facts.join(" · ")}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="cash"
          size={18}
          color={Colors.textMutedDark}
        />
        <Text style={styles.infoText}>{formatRent(unit.rent)}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="calendar-outline"
          size={18}
          color={Colors.textMutedDark}
        />
        <Text style={styles.infoText}>
          Since {new Date(tenancy.startDate).toLocaleDateString()}
          {tenancy.endDate
            ? ` · ended ${new Date(tenancy.endDate).toLocaleDateString()}`
            : ""}
        </Text>
      </View>

      {landlord && (
        <View style={styles.landlordBox}>
          <Text style={styles.landlordLabel}>Your landlord</Text>
          <Text style={styles.landlordName}>
            {landlord.businessName ?? landlord.name}
          </Text>
          {landlord.email && (
            <Text style={styles.landlordEmail}>{landlord.email}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function TenantDashboard() {
  const router = useRouter();
  const user = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: tenancies,
    isLoading,
    error,
    refetch: refetchTenancies,
  } = useMyTenanciesQuery();
  const { data: unreadData, refetch: refetchUnread } = useUnreadCountQuery();
  const unreadCount = unreadData ?? 0;

  useFocusEffect(
    useCallback(() => {
      refetchUnread();
    }, [refetchUnread]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refetchTenancies(), refetchUnread()]);
    setRefreshing(false);
  }

  const isSample = tenancies === SAMPLE_TENANCIES;
  const active = (tenancies ?? []).filter((t) => t.status === "Active");
  const past = (tenancies ?? []).filter((t) => t.status !== "Active");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>
            Domus<Text style={styles.logoTextAccent}>PRO</Text>
          </Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push("/notifications")}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color={Colors.primaryDark}
            />
            {unreadCount > 0 && <View style={styles.bellDot} />}
          </Pressable>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.role}>{user.role}</Text>
          </View>
        </View>

        {isSample && (
          <Text style={styles.sampleBanner}>
            Sample data — your real home will show here once it's available.
          </Text>
        )}

        {isLoading && (
          <ActivityIndicator style={{ marginTop: 32 }} color={Colors.accentOrange} />
        )}

        {error && <Text style={styles.error}>{error.message}</Text>}

        {!isLoading && !error && tenancies?.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="home-search-outline"
              size={32}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No homes yet</Text>
            <Text style={styles.emptyText}>
              Once you accept an invite from your landlord, your home will
              appear here.
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My home</Text>
            {active.map((t) => (
              <TenancyCard key={t.tenancyId} tenancy={t} />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past homes</Text>
            {past.map((t) => (
              <TenancyCard key={t.tenancyId} tenancy={t} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 18,
  },
  logoText: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  logoTextAccent: { color: Colors.brandRed },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandRed,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: 17 },
  name: { fontSize: 18, fontWeight: "700", color: Colors.primaryDark },
  role: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 10,
    marginTop: 4,
  },
  sampleBanner: {
    backgroundColor: Colors.orangeTint,
    color: Colors.accentOrange,
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  error: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    fontSize: 15,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.primaryDark },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  propertyName: { fontSize: 18, fontWeight: "700", color: Colors.primaryDark },
  unitLabel: { fontSize: 14, color: Colors.accentOrange, marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: Colors.tealTint },
  badgeEnded: { backgroundColor: Colors.background },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextActive: { color: Colors.accentTeal },
  badgeTextEnded: { color: Colors.textMuted },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, fontSize: 14, color: Colors.textMutedDark },
  landlordBox: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  landlordLabel: { fontSize: 13, color: Colors.textMuted },
  landlordName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginTop: 2,
  },
  landlordEmail: { fontSize: 14, color: Colors.accentTeal, marginTop: 2 },
});
