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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
     const workingItems: MenuItem[] = [
    { icon: "view-dashboard-outline", label: "Dashboard", onPress: () => go("/") },
    { icon: "office-building-outline", label: "Properties", onPress: () => go("/properties") },
    { icon: "account-group-outline", label: "Tenants", onPress: () => go("/tenants") },
  ];
  const soonItems: MenuItem[] = [
    { icon: "clipboard-account-outline", label: "Leads & Applications", soon: true, onPress: () => comingSoon("Leads & Applications") },
    { icon: "account-hard-hat", label: "Contractors", soon: true, onPress: () => comingSoon("Contractors") },
    { icon: "receipt-text-outline", label: "Expenses", soon: true, onPress: () => comingSoon("Expenses") },
    { icon: "email-outline", label: "Contact us", soon: true, onPress: () => comingSoon("Contact us") },
  ];
  const accountItems: MenuItem[] = [
    { icon: "account-circle-outline", label: "Account", onPress: () => go("/profile") },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[styles.panel, { width: DRAWER_WIDTH, transform: [{ translateX }] }]}
      >
                       <View style={[styles.panelInner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.menuList}>
            <View style={styles.logoRow}>
              <Image
                source={require("@/assets/images/domuspro-logo.png")}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>

            <Pressable onPress={() => comingSoon("Upgrade plan")}>
              {({ pressed }) => (
                <View style={[styles.upgradeCard, pressed && styles.upgradeCardPressed]}>
                  <View style={styles.upgradeIconBadge}>
                    <MaterialCommunityIcons name="crown" size={16} color={Colors.accentOrange} />
                  </View>
                  <View style={styles.upgradeTextGroup}>
                    <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                    <Text style={styles.upgradeSubtitle}>More properties, more tools</Text>
                  </View>
                  <View style={styles.upgradeArrowBadge}>
                    <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.white} />
                  </View>
                </View>
              )}
            </Pressable>

            {workingItems.map((item) => (
              <MenuRow key={item.label} item={item} active={item.label === "Dashboard"} />
            ))}
            <View style={styles.divider} />

            {soonItems.map((item) => (
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
        </View>
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
    height: 52,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  logoImage: { width: 150, height: 50 },
  upgradeCard: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: Colors.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  upgradeIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeTextGroup: { flex: 1 },
  upgradeTitle: { fontSize: 14, fontWeight: "700", color: Colors.white },
  upgradeSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  upgradeArrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    height: 44,
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
    height: 1,
    marginVertical: 8,
    backgroundColor: Colors.divider,
  },
  signOutLabel: { fontSize: 13, fontWeight: "600", color: Colors.errorText },
});