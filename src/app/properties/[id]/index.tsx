import { PhotoCarousel } from "@/components/photo-carousel";
import { Colors } from "@/constants/colors";
import {
  getPropertyMedia,
  setPropertyMediaCover,
  uploadPropertyPhotos,
} from "@/lib/media-api";
import { getProperty } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { MediaItem, Property, Unit } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAX_PROPERTY_PHOTOS = 5; // mirrors AddPropertyMediaCommandHandler's MaxPhotosPerProperty
// No vacancy status is tracked per property yet, so occupancy is a placeholder:
// any property with units counts as fully occupied. Same logic as the dashboard.
function propertyOccupancy(property: Property): number {
  return property.units.length > 0 ? 100 : 0;
}

function unitStatusTint(status: string): string {
  return status.toLowerCase() === "occupied"
    ? Colors.accentTeal
    : Colors.accentOrange;
}

function unitStatusBg(status: string): string {
  return status.toLowerCase() === "occupied"
    ? Colors.tealTint
    : Colors.orangeTint;
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useSession();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [data, media] = await Promise.all([
        getProperty(id, user.token),
        getPropertyMedia(id, user.token),
      ]);
      setProperty(data);
      setPhotos(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property.");
    }
  }, [id, user.token]);

  async function handleAddPhoto() {
    if (photos.length >= MAX_PROPERTY_PHOTOS) {
      Alert.alert(
        "Limit reached",
        `A property can have at most ${MAX_PROPERTY_PHOTOS} photos. Remove one to add another.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to add property photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PROPERTY_PHOTOS - photos.length,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setUploadingPhoto(true);
    try {
      await uploadPropertyPhotos(id, result.assets, photos.length, user.token);
      setPhotos(await getPropertyMedia(id, user.token));
    } catch (err) {
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSetCover(mediaId: number) {
    setSettingCover(true);
    try {
      await setPropertyMediaCover(id, mediaId, user.token);
      setPhotos(await getPropertyMedia(id, user.token));
    } catch (err) {
      Alert.alert(
        "Couldn't set cover photo",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSettingCover(false);
    }
  }
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={Colors.primaryDark}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {property.name}
        </Text>
        <Pressable
          style={styles.iconButton}
          onPress={() =>
            router.push({
              pathname: "/properties/[id]/units/new",
              params: { id },
            })
          }
        >
          <MaterialCommunityIcons
            name="plus"
            size={22}
            color={Colors.primaryDark}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PhotoCarousel
          photos={photos}
          maxPhotos={MAX_PROPERTY_PHOTOS}
          onAddPhoto={handleAddPhoto}
          onSetCover={handleSetCover}
          uploading={uploadingPhoto}
          settingCover={settingCover}
        />

        <View style={styles.propertyInfoCard}>
          <View style={styles.propertyInfoText}>
            <Text style={styles.propertyInfoName} numberOfLines={1}>
              {property.line1}
            </Text>
            <Text style={styles.propertyInfoSubtitle}>
              {property.city} · {property.units.length} unit
              {property.units.length === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Rent Collected</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Rent Due</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{propertyOccupancy(property)}%</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Open Request</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>List of Units</Text>
          <Text style={styles.unitsCount}>{property.units.length} Units</Text>
        </View>
        <View style={styles.unitsList}>
          {property.units.map((unit: Unit) => (
            <Pressable
              key={unit.id}
              style={styles.unitCard}
              onPress={() =>
                router.push({
                  pathname: "/properties/[id]/units/[unitId]",
                  params: { id, unitId: String(unit.id) },
                })
              }
            >
              <View>
                <Text style={styles.unitLabel}>{unit.label}</Text>
                <Text style={styles.unitBeds}>
                  {unit.bedrooms} bed · {unit.bathrooms} bath
                </Text>
              </View>
              <View
                style={[
                  styles.unitStatusPill,
                  { backgroundColor: unitStatusBg(unit.status) },
                ]}
              >
                <Text
                  style={[
                    styles.unitStatusText,
                    { color: unitStatusTint(unit.status) },
                  ]}
                >
                  {unit.status}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.addUnitLink}
          onPress={() =>
            router.push({
              pathname: "/properties/[id]/units/new",
              params: { id },
            })
          }
        >
          <MaterialCommunityIcons
            name="plus"
            size={14}
            color={Colors.accentOrange}
          />
          <Text style={styles.addUnitLinkText}>Add unit</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  error: { color: Colors.errorText, fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.primaryDark,
    textAlign: "left",
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginTop: 22,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: Colors.primaryDark },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitsCount: { fontSize: 12, color: Colors.textMuted },
  empty: { color: Colors.textMutedDark, fontSize: 13 },
  propertyInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  propertyInfoText: { flex: 1, minWidth: 0 },
  propertyInfoName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  propertyInfoSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: Colors.tealTint,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: Colors.accentTeal },
  unitsList: { gap: 10 },
  unitCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  unitBeds: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unitStatusPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unitStatusText: { fontSize: 10, fontWeight: "600" },
  addUnitLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
  },
  addUnitLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accentOrange,
  },
  unitLabel: { fontSize: 14, fontWeight: "700", color: Colors.primaryDark },
});
