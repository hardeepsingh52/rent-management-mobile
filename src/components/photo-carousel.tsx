import { Colors } from "@/constants/colors";
import type { MediaItem } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

interface PhotoCarouselProps {
  photos: MediaItem[];
  onAddPhoto: () => void;
  uploading?: boolean;
}

export function PhotoCarousel({ photos, onAddPhoto, uploading }: PhotoCarouselProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      {photos.length === 0 ? (
        <Image
          source={require("@/assets/images/property-placeholder.jpg")}
          style={styles.photo}
          contentFit="cover"
        />
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
        >
          {photos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.url }}
              style={[styles.photo, { width: width || undefined }]}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.addButton} onPress={onAddPhoto} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <MaterialCommunityIcons name="camera-plus-outline" size={16} color={Colors.white} />
        )}
      </Pressable>

      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  photo: { width: "100%", height: 190, borderRadius: 18 },
  addButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(22, 48, 43, 0.55)", // Colors.primaryDark at 55% opacity
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.5)" },
  dotActive: { backgroundColor: Colors.white },
});