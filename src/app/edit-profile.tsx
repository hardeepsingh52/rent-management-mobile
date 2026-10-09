import { FormField } from "@/components/form-field";
import { Colors } from "@/constants/colors";
import { updateMyProfile } from "@/lib/profile-api";
import { useProfileQuery } from "@/lib/queries";
import { useSession, useSessionContext } from "@/lib/session-context";
import type { UserProfile } from "@/lib/types";
import { useFormErrors } from "@/lib/use-form-errors";
import { required } from "@/lib/validators";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Field = "firstName" | "lastName";

const SERVER_FIELDS = { firstName: /first/i, lastName: /last/i };

function EditProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const user = useSession();
  const { updateFullName } = useSessionContext();
  const queryClient = useQueryClient();
  const { errors, clearError, validate, applyServerErrors } =
    useFormErrors<Field>();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [middleName, setMiddleName] = useState(profile.middleName ?? "");
  const [lastName, setLastName] = useState(profile.lastName);
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    const valid = validate({
      firstName: required(firstName, "First name"),
      lastName: required(lastName, "Last name"),
    });
    if (!valid) {
      return;
    }

    setBanner(null);
    setSubmitting(true);
    try {
      const updated = await updateMyProfile(
        {
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
        },
        user.token,
      );
      queryClient.setQueryData(["profile", user.id], updated);
      await updateFullName(updated.fullName);
      router.back();
    } catch (err) {
      setBanner(
        applyServerErrors(
          err,
          SERVER_FIELDS,
          "Couldn't save your name. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {banner && <Text style={styles.banner}>{banner}</Text>}

        <FormField
          label="First name"
          icon="account-outline"
          value={firstName}
          onChangeText={(value) => {
            setFirstName(value);
            clearError("firstName");
          }}
          error={errors.firstName}
          autoComplete="given-name"
          maxLength={100}
          editable={!submitting}
        />
        <FormField
          label="Middle name (optional)"
          icon="account-outline"
          value={middleName}
          onChangeText={setMiddleName}
          autoComplete="additional-name"
          maxLength={100}
          editable={!submitting}
        />
        <FormField
          label="Last name"
          icon="account-outline"
          value={lastName}
          onChangeText={(value) => {
            setLastName(value);
            clearError("lastName");
          }}
          error={errors.lastName}
          autoComplete="family-name"
          maxLength={100}
          editable={!submitting}
        />

        <Pressable
          style={styles.button}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EditProfileScreen() {
  const { data: profile, error, refetch } = useProfileQuery();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {profile ? (
        <EditProfileForm profile={profile} />
      ) : error ? (
        <Pressable style={styles.center} onPress={() => refetch()}>
          <Text style={styles.banner}>
            Couldn&apos;t load your profile. Tap to try again.
          </Text>
        </Pressable>
      ) : (
        <ActivityIndicator style={styles.center} color={Colors.accentOrange} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", padding: 20 },
  banner: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 28,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
