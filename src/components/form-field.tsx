import type { Ref } from "react";
import { FieldError, fieldErrorBorder } from "@/components/field-error";
import { Colors } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  // Lets a form scroll to this field (see useScrollToField).
  fieldRef?: Ref<View>;
}

// Label + icon input + inline error, matching the property/unit form styling.
export function FormField({
  label,
  icon,
  error,
  fieldRef,
  style,
  ...inputProps
}: FormFieldProps) {
  return (
    <View ref={fieldRef}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.wrapper, error ? fieldErrorBorder : styles.wrapperIdle]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={Colors.textMutedDark}
        />
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          {...inputProps}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginBottom: 6,
    marginTop: 14,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  // Same width as the error border so the field doesn't jump when it appears.
  wrapperIdle: { borderWidth: 1.5, borderColor: Colors.white },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.primaryDark,
  },
});
