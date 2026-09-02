import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

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
    backgroundColor: Colors.white,
  },
  text: { fontSize: 14, color: Colors.textMutedDark },
});
