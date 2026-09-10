import { PhotoStrip } from "@/components/photo-strip";
import { PhotoViewerModal } from "@/components/photo-viewer-modal";
import { Colors } from "@/constants/colors";
import { getUnitMedia, uploadUnitPhotos } from "@/lib/media-api";
import { getProperty } from "@/lib/properties-api";
import { useSession } from "@/lib/session-context";
import type { MediaItem, Unit } from "@/lib/types";
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

const MAX_UNIT_PHOTOS = 10; // mirrors AddUnitMediaCommandHandler's MaxPhotosPerUnit

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
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

export default function UnitDetailScreen() {
  const { id, unitId } = useLocalSearchParams<{ id: string; unitId: string }>();
  const user = useSession();
  const router = useRouter();
   const [unit, setUnit] = useState<Unit | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [property, media] = await Promise.all([
        getProperty(id, user.token),
        getUnitMedia(unitId, user.token),
      ]);
      const match = property.units.find((u) => String(u.id) === unitId);
      if (!match) {
        setError("Unit not found.");
        return;
      }
      setUnit(match);
      setPhotos(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load unit.");
    }
  }, [id, unitId, user.token]);

  async function handleAddPhoto() {
    if (photos.length >= MAX_UNIT_PHOTOS) {
      Alert.alert(
        "Limit reached",
        `A unit can have at most ${MAX_UNIT_PHOTOS} photos. Remove one to add another.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add unit photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_UNIT_PHOTOS - photos.length,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setUploadingPhoto(true);
    try {
      await uploadUnitPhotos(unitId, result.assets, photos.length, user.token);
      setPhotos(await getUnitMedia(unitId, user.token));
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploadingPhoto(false);
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

  if (!unit) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={Colors.primaryDark}
            />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {unit.label}
          </Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => comingSoon("Edit unit")}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={18}
              color={Colors.primaryDark}
            />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[styles.badge, { backgroundColor: unitStatusBg(unit.status) }]}
          >
            <Text
              style={[styles.badgeText, { color: unitStatusTint(unit.status) }]}
            >
              {unit.status}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unit.unitType}</Text>
          </View>
        </View>

                      <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Media</Text>
          <PhotoStrip
            photos={photos}
            onAddPhoto={handleAddPhoto}
            onPhotoPress={setViewerIndex}
            uploading={uploadingPhoto}
            maxPhotos={MAX_UNIT_PHOTOS}
          />
          <Text style={styles.mediaNote}>
            Photos can&apos;t be removed without admin help.
          </Text>
        </View>

        <View style={styles.rentCard}>
          <Text style={styles.rentLabel}>ASKING RENT</Text>
          <Text style={styles.rentValue}>
            ${unit.askingRent.toLocaleString()}
            <Text style={styles.rentPeriod}>/month</Text>
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <MaterialCommunityIcons name="bed-outline" size={16} color={Colors.accentOrange} />
            <Text style={styles.statValue}>{unit.bedrooms}</Text>
            <Text style={styles.statLabel}>
              {unit.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
            </Text>
          </View>
          <View style={styles.statTile}>
            <MaterialCommunityIcons name="shower" size={16} color={Colors.accentOrange} />
            <Text style={styles.statValue}>{unit.bathrooms}</Text>
            <Text style={styles.statLabel}>
              {unit.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
            </Text>
          </View>
          <View style={styles.statTile}>
            <MaterialCommunityIcons name="ruler-square" size={16} color={Colors.accentOrange} />
            <Text style={styles.statValue}>{unit.squareFeet}</Text>
            <Text style={styles.statLabel}>Sq ft</Text>
          </View>
        </View>
           </ScrollView>
      <PhotoViewerModal
        photos={photos}
        visible={viewerIndex !== null}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
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
    marginBottom: 14,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginHorizontal: 10,
  },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  badge: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: Colors.textMutedDark },
  mediaSection: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  mediaNote: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  rentCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rentLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rentValue: { fontSize: 24, fontWeight: "700", color: Colors.primaryDark },
  rentPeriod: { fontSize: 12, fontWeight: "500", color: Colors.textMuted },
  statsRow: { flexDirection: "row", gap: 8 },
  statTile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 15, fontWeight: "700", color: Colors.primaryDark, marginTop: 6 },
  statLabel: { fontSize: 10, color: Colors.textMuted },
});