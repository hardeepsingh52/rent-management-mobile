import { Colors } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function comingSoon(feature: string) {
  Alert.alert("Coming soon", `${feature} isn't wired up yet.`);
}

const DRAWER_WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

interface MenuItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  soon?: boolean;
  onPress: () => void;
}

function MenuRow({ item, active }: { item: MenuItem; active?: boolean }) {
  return (
    <Pressable
      style={[styles.row, active && styles.rowActive]}
      onPress={item.onPress}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={18}
        color={active ? Colors.accentOrange : Colors.textMutedDark}
      />
      <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
        {item.label}
      </Text>
      {item.soon && <Text style={styles.soonLabel}>Soon</Text>}
    </Pressable>
  );
}

export function SideMenu({
  visible,
  onClose,
  onNavigate,
  onSignOut,
  role,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (path: "/" | "/properties" | "/tenants" | "/profile") => void;
  onSignOut: () => void;
  role: string;
}) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  function go(path: "/" | "/properties" | "/tenants" | "/profile") {
    onClose();
    onNavigate(path);
  }

  const coreItems: MenuItem[] = [
    { icon: "view-dashboard-outline", label: "Dashboard", onPress: () => go("/") },
    { icon: "office-building-outline", label: "Properties", onPress: () => go("/properties") },
    { icon: "archive-outline", label: "Archived", soon: true, onPress: () => comingSoon("Archived") },
  ];
  const pipelineItems: MenuItem[] = [
    { icon: "target-account", label: "Leads", soon: true, onPress: () => comingSoon("Leads") },
    { icon: "clipboard-text-outline", label: "Applications", soon: true, onPress: () => comingSoon("Applications") },
    { icon: "account-group-outline", label: "Tenants", onPress: () => go("/tenants") },
    { icon: "file-document-outline", label: "Leases", soon: true, onPress: () => comingSoon("Leases") },
  ];
  const opsItems: MenuItem[] = [
    { icon: "credit-card-outline", label: "Payments", soon: true, onPress: () => comingSoon("Payments") },
    { icon: "receipt-text-outline", label: "Expenses", soon: true, onPress: () => comingSoon("Expenses") },
    { icon: "wrench-outline", label: "Maintenance", soon: true, onPress: () => comingSoon("Maintenance") },
    { icon: "chart-bar", label: "Reports", soon: true, onPress: () => comingSoon("Reports") },
  ];
  const accountItems: MenuItem[] = [
    { icon: "account-plus-outline", label: "Invite tenant", soon: true, onPress: () => comingSoon("Invite tenant") },
    { icon: "account-circle-outline", label: "Account", onPress: () => go("/profile") },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[styles.panel, { width: DRAWER_WIDTH, transform: [{ translateX }] }]}
      >
        <SafeAreaView style={styles.panelInner} edges={["top", "bottom"]}>
          <View style={styles.menuList}>
            <View style={styles.logoRow}>
              <Image
                source={require("@/assets/images/domuspro-logo.png")}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.roleLabelRow}>
              <Text style={styles.roleLabel}>{role.toUpperCase()}</Text>
            </View>

            <Pressable style={styles.upgradeCard} onPress={() => comingSoon("Upgrade plan")}>
              <MaterialCommunityIcons name="crown-outline" size={18} color={Colors.orangeTint} />
              <Text style={styles.upgradeTitle}>Upgrade plan</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.tealTint} />
            </Pressable>

            {coreItems.map((item) => (
              <MenuRow key={item.label} item={item} active={item.label === "Dashboard"} />
            ))}
            <View style={styles.divider} />
            {pipelineItems.map((item) => (
              <MenuRow key={item.label} item={item} />
            ))}
            <View style={styles.divider} />
            {opsItems.map((item) => (
              <MenuRow key={item.label} item={item} />
            ))}
            <View style={styles.divider} />
            {accountItems.map((item) => (
              <MenuRow key={item.label} item={item} />
            ))}
            <View style={styles.divider} />

            <Pressable style={styles.row} onPress={onSignOut}>
              <MaterialCommunityIcons name="logout" size={18} color={Colors.errorText} />
              <Text style={styles.signOutLabel}>Log out</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(22, 48, 43, 0.4)",
  },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.white,
  },
  panelInner: { flex: 1 },
  menuList: { flex: 1, padding: 14 },
  logoRow: {
    flex: 1.4,
    maxHeight: 52,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  logoImage: { width: 150, height: 50 },
  roleLabelRow: { flex: 0.6, justifyContent: "center", paddingHorizontal: 8 },
  roleLabel: { fontSize: 10, fontWeight: "600", color: Colors.textMuted, letterSpacing: 0.5 },
  upgradeCard: {
    flex: 1.6,
    maxHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  upgradeTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: Colors.white },
  row: {
    flex: 1,
    maxHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowActive: { backgroundColor: Colors.orangeTint },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.primaryDark },
  rowLabelActive: { color: Colors.accentOrange, fontWeight: "600" },
  soonLabel: { fontSize: 10, color: Colors.borderLighter },
  divider: {
    flex: 0.3,
    maxHeight: 14,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  signOutLabel: { fontSize: 13, fontWeight: "600", color: Colors.errorText },
});