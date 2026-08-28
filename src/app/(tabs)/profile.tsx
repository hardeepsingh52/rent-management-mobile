import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
    backgroundColor: "#fff",
    gap: 6,
  },
  name: { fontSize: 18, fontWeight: "600", color: "#111" },
  email: { fontSize: 13, color: "#5f5e5a" },
  button: {
    marginTop: 20,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: "#b91c1c", fontWeight: "600", fontSize: 14 },
});
