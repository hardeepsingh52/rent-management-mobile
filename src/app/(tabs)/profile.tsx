import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { useSession, useSessionContext } from "@/lib/session-context";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useSession();
  const { signOut } = useSessionContext();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.fullName}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    gap: 6,
  },
  name: { fontSize: 18, fontWeight: "600", color: Colors.primaryDark },
  email: { fontSize: 13, color: Colors.textMutedDark },
  button: {
    marginTop: 20,
    backgroundColor: Colors.errorBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: Colors.errorText, fontWeight: "600", fontSize: 14 },
});
