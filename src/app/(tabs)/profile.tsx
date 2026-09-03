import { Colors } from "@/constants/colors";
import { useSession, useSessionContext } from "@/lib/session-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
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

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
}

function ProfileRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={Colors.textMutedDark}
        />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : onPress ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={Colors.borderLight}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }
  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useSession();
  const { signOut } = useSessionContext();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.card}>
          <ProfileRow
            icon="account-outline"
            label="Edit profile"
            onPress={() => comingSoon("Edit profile")}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="lock-outline"
            label="Change password"
            onPress={() => comingSoon("Change password")}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="bell-outline"
            label="Notifications"
            onPress={() => comingSoon("Notifications")}
          />
        </View>

        <View style={styles.card}>
          <ProfileRow
            icon="help-circle-outline"
            label="Help and support"
            onPress={() => comingSoon("Help and support")}
          />
          <View style={styles.divider} />
          <ProfileRow icon="information-outline" label="App version" value="1.0.0" />
        </View>

        <Pressable style={styles.signOutCard} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: Colors.white },
  name: { fontSize: 17, fontWeight: "700", color: Colors.primaryDark },
  email: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: "500", color: Colors.primaryDark },
  rowValue: { fontSize: 13, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.divider },
  signOutCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  signOutText: { fontSize: 14, fontWeight: "600", color: Colors.errorText },
});