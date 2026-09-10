import { Colors } from "@/constants/colors";
import type { MediaItem } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PhotoCarouselProps {
  photos: MediaItem[];
  maxPhotos: number;
  onAddPhoto: () => void;
  onSetCover: (mediaId: number) => void;
  uploading?: boolean;
  settingCover?: boolean;
}

export function PhotoCarousel({
  photos,
  maxPhotos,
  onAddPhoto,
  onSetCover,
  uploading,
  settingCover,
}: PhotoCarouselProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderedPhotos = useMemo(() => {
    const coverIndex = photos.findIndex((photo) => photo.isCover);
    if (coverIndex <= 0) return photos;
    const reordered = [...photos];
    const [cover] = reordered.splice(coverIndex, 1);
    return [cover, ...reordered];
  }, [photos]);

  useEffect(() => {
    setActiveIndex(0);
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [orderedPhotos[0]?.id]);

  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, []);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      setActiveIndex(Math.round(offsetX / width));
    }, 100);
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
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {orderedPhotos.map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.url }}
              style={[styles.photo, { width: width || undefined }]}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      )}

      <Pressable
        style={[
          styles.addButton,
          photos.length >= maxPhotos && styles.addButtonDisabled,
        ]}
        onPress={onAddPhoto}
        disabled={uploading || photos.length >= maxPhotos}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <MaterialCommunityIcons
            name="camera-plus-outline"
            size={16}
            color={Colors.white}
          />
        )}
      </Pressable>
      {photos.length > 0 && (
        <Pressable
          style={styles.coverButton}
          onPress={() => onSetCover(orderedPhotos[activeIndex].id)}
          disabled={settingCover || orderedPhotos[activeIndex].isCover}
        >
          <MaterialCommunityIcons
            name={orderedPhotos[activeIndex].isCover ? "star" : "star-outline"}
            size={14}
            color={
              orderedPhotos[activeIndex].isCover
                ? Colors.accentOrange
                : Colors.white
            }
          />
          <Text style={styles.coverButtonText}>
            {orderedPhotos[activeIndex].isCover ? "Cover" : "Set cover"}
          </Text>
        </Pressable>
      )}
      {photos.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {photos.length}/{maxPhotos}
          </Text>
        </View>
      )}
      {photos.length > 1 && (
        <View style={styles.dots}>
          {orderedPhotos.map((photo, index) => (
            <View
              key={photo.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: { backgroundColor: Colors.white },
  coverButton: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(22, 48, 43, 0.55)",
  },
  coverButtonText: { fontSize: 11, fontWeight: "600", color: Colors.white },
  addButtonDisabled: { opacity: 0.4 },
  countBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(22, 48, 43, 0.55)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: { fontSize: 10, fontWeight: "600", color: Colors.white },
});
