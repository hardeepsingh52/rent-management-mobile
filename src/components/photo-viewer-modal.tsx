import { Colors } from "@/constants/colors";
import type { MediaItem } from "@/lib/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface PhotoViewerModalProps {
  photos: MediaItem[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}

export function PhotoViewerModal({ photos, visible, initialIndex, onClose }: PhotoViewerModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [width] = useState(Dimensions.get("window").width);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setActiveIndex(initialIndex);
    // Modal content can stay mounted between opens, so contentOffset (which
    // only applies on first mount) isn't enough - jump to the right page
    // imperatively every time the viewer opens.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * width, animated: false });
    });
  }, [visible, initialIndex, width]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.white} />
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={[styles.page, { width }]}>
              <Image source={{ uri: photo.url }} style={styles.photo} contentFit="contain" />
            </View>
          ))}
        </ScrollView>

        {photos.length > 1 && (
          <Text style={styles.counter}>
            {activeIndex + 1} / {photos.length}
          </Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.95)" },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 18,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  page: { alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: "100%" },
  counter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});