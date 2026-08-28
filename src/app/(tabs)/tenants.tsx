import { StyleSheet, Text, View } from "react-native";

export default function PropertiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tenants — coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: { fontSize: 14, color: "#5f5e5a" },
});
