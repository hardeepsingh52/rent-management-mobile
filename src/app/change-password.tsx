import { FormField } from "@/components/form-field";
import { Colors } from "@/constants/colors";
import { changePassword, forgotPassword } from "@/lib/auth-api";
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  saveBiometricSession,
} from "@/lib/biometric-session";
import { useSession, useSessionContext } from "@/lib/session-context";
import { useFormErrors } from "@/lib/use-form-errors";
import { password as passwordRule, required } from "@/lib/validators";
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

type Field = "current" | "next" | "confirm";

const SERVER_FIELDS = {
  current: /current/i,
  next: /new/i,
};

async function requireBiometricIfAvailable(): Promise<boolean> {
  if (!(await isBiometricAvailable())) {
    return true;
  }
  return authenticateWithBiometrics("Confirm it's you");
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const user = useSession();
  const { signIn } = useSessionContext();
  const { errors, clearError, validate, applyServerErrors } =
    useFormErrors<Field>();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  async function handleSubmit() {
    const valid = validate({
      current: required(current, "Current password"),
      next: passwordRule(next),
      confirm: confirm === next ? null : "The new passwords don't match.",
    });
    if (!valid) {
      return;
    }
    if (!(await requireBiometricIfAvailable())) {
      return;
    }

    setBanner(null);
    setSubmitting(true);
    try {
      const session = await changePassword(current, next, user.token);
      // Every other device was just signed out; keep this one signed in.
      await signIn(session);
      try {
        if (await isBiometricAvailable()) {
          await saveBiometricSession(session);
        }
      } catch {
        // Biometric caching is a nice-to-have; never block on it.
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      setBanner(
        applyServerErrors(
          err,
          SERVER_FIELDS,
          "Couldn't change your password. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendLink() {
    setSendingLink(true);
    setLinkMessage(null);
    try {
      await forgotPassword(user.email);
      setLinkMessage(`We sent a reset link to ${user.email}.`);
    } catch (err) {
      setLinkMessage(
        err instanceof Error ? err.message : "Couldn't send the link.",
      );
    } finally {
      setSendingLink(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successText}>
            Your other devices were signed out. We also emailed you a security
            notice.
          </Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.warning}>
            Finishing this signs you out of every other device.
          </Text>

          {banner && <Text style={styles.banner}>{banner}</Text>}

          <FormField
            label="Current password"
            icon="lock-outline"
            value={current}
            onChangeText={(value) => {
              setCurrent(value);
              clearError("current");
            }}
            error={errors.current}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!submitting}
          />
          <FormField
            label="New password"
            icon="lock-plus-outline"
            value={next}
            onChangeText={(value) => {
              setNext(value);
              clearError("next");
            }}
            error={errors.next}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!submitting}
          />
          <Text style={styles.hint}>
            At least 8 characters, with upper and lower case letters, a number,
            and a symbol.
          </Text>
          <FormField
            label="Confirm new password"
            icon="lock-check-outline"
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              clearError("confirm");
            }}
            error={errors.confirm}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!submitting}
          />

          <Pressable
            style={styles.button}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Update password</Text>
            )}
          </Pressable>

          <Pressable onPress={handleSendLink} disabled={sendingLink}>
            <Text style={styles.link}>
              {sendingLink
                ? "Sending…"
                : "Forgot your current password? Email me a reset link"}
            </Text>
          </Pressable>
          {linkMessage && <Text style={styles.linkMessage}>{linkMessage}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  warning: {
    backgroundColor: Colors.orangeTint,
    color: Colors.primaryDark,
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 4,
  },
  banner: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 28,
    marginBottom: 18,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  link: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  linkMessage: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primaryDark,
    textAlign: "center",
    marginTop: 24,
  },
  successText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
