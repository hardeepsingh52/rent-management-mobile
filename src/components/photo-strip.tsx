import { Colors } from "@/constants/colors";
import type { MediaItem } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface PhotoStripProps {
  photos: MediaItem[];
  onAddPhoto: () => void;
  onPhotoPress: (index: number) => void;
  uploading?: boolean;
  maxPhotos: number;
}

export function PhotoStrip({ photos, onAddPhoto, onPhotoPress, uploading, maxPhotos }: PhotoStripProps) {
  const canAddMore = photos.length < maxPhotos;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {photos.map((photo, index) => (
          <Pressable key={photo.id} onPress={() => onPhotoPress(index)}>
            <Image source={{ uri: photo.url }} style={styles.thumb} contentFit="cover" />
          </Pressable>
        ))}
        {canAddMore && (
          <Pressable style={styles.addTile} onPress={onAddPhoto} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.accentOrange} />
            ) : (
              <MaterialCommunityIcons name="plus" size={18} color={Colors.accentOrange} />
            )}
          </Pressable>
        )}
      </ScrollView>
      {photos.length === 0 && <Text style={styles.empty}>No photos yet.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingBottom: 2 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});