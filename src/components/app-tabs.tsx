import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1, paddingBottom: 90 }} />
      <TabList asChild>
        <FloatingTabBar>
          <TabTrigger name="dashboard" href="/" asChild>
            <TabButton icon="view-dashboard" label="Dashboard" />
          </TabTrigger>
          <TabTrigger name="properties" href="/(tabs)/properties" asChild>
            <TabButton icon="office-building" label="Properties" />
          </TabTrigger>
          <View style={styles.fabSpacer} />
          <TabTrigger name="tenants" href="/(tabs)/tenants" asChild>
            <TabButton icon="account-group" label="Tenants" />
          </TabTrigger>
          <TabTrigger name="profile" href="/(tabs)/profile" asChild>
            <TabButton icon="account-circle" label="Profile" />
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  label,
  isFocused,
  ...props
}: TabTriggerSlotProps & {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <Pressable {...props} style={styles.tabButton}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={isFocused ? "#16302b" : "#b6b9c9"}
      />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FloatingTabBar({ children, ...props }: TabListProps) {
  const router = useRouter();
  return (
    <View {...props} style={styles.island}>
      {children}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/properties/new")}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  island: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: "#16302b",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabSpacer: { width: 52 },
  fab: {
    position: "absolute",
    left: "50%",
    top: -20,
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f4793a",
    borderWidth: 4,
    borderColor: "#f5f6fa",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  tabLabel: { fontSize: 9, color: "#b6b9c9" },
  tabLabelFocused: { color: "#16302b", fontWeight: "600" },
});
