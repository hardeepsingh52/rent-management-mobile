import { Colors } from "@/constants/colors";
import { StyleSheet, Text, type TextStyle } from "react-native";

export function FieldError({
  message,
  style,
}: {
  message?: string;
  style?: TextStyle;
}) {
  if (!message) {
    return null;
  }
  return <Text style={[styles.text, style]}>{message}</Text>;
}

export const fieldErrorBorder = {
  borderWidth: 1.5,
  borderColor: Colors.errorText,
} as const;

const styles = StyleSheet.create({
  text: { color: Colors.errorText, fontSize: 12, marginTop: 4 },
});
