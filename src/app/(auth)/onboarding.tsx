import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/app-onboarding-picture.jpg")}
        style={styles.hero}
        contentFit="cover"
      />
      <SafeAreaView style={styles.cardWrapper} edges={["bottom"]}>
        <View style={styles.card}>
          <Text style={styles.title}>
            Simplify Property{"\n"}Management in One App
          </Text>
          <Text style={styles.subtitle}>
            Rent collection, maintenance tracking, communication tools
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/login")}
          >
          <MaterialCommunityIcons
              name="arrow-top-right"
              size={18}
              color="#fff"
            />
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#16302b" },
  hero: { flex: 1, width: "100%" },
  cardWrapper: { position: "absolute", left: 0, right: 0, bottom: 0 },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 36,
    marginRight:12,
    marginLeft:12,
    marginBottom:18,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#16302b",
    lineHeight: 30,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#8a8fa8",
    marginTop: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff3131",
    borderRadius: 28,
    paddingVertical: 16,
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});