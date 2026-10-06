import { Colors } from "@/constants/colors";
import { recoveryLogin, verifyTwoFactor } from "@/lib/auth-api";
import { isBiometricAvailable, saveBiometricSession } from "@/lib/biometric-session";
import { useSessionContext } from "@/lib/session-context";
import {
  clearPendingTwoFactorToken,
  getPendingTwoFactorToken,
} from "@/lib/two-factor-handoff";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TwoFactorVerifyScreen() {
  const router = useRouter();
  const { signIn } = useSessionContext();
  const [mode, setMode] = useState<"code" | "recovery">("code");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!getPendingTwoFactorToken()) {
    router.replace("/(auth)/login");
  }
}, []);

  async function completeSignIn(session: Parameters<typeof signIn>[0]) {
    clearPendingTwoFactorToken();
    await signIn(session);
    try {
      if (await isBiometricAvailable()) {
        await saveBiometricSession(session);
      }
    } catch {
      // Biometric caching is a nice-to-have; never block a successful login on it.
    }
    router.replace("/");
  }

 async function handleSubmit() {
  const token = getPendingTwoFactorToken();
  if (!token) {
    return;
  }
  setError(null);
  setLoading(true);
  try {
    const session =
      mode === "code"
        ? await verifyTwoFactor(token, code)
        : await recoveryLogin(token, recoveryCode);
    await completeSignIn(session);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.",
    );
  } finally {
    setLoading(false);
  }
}

  function handleBackToLogin() {
    clearPendingTwoFactorToken();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="shield-lock-outline"
              size={40}
              color={Colors.accentTeal}
            />
          </View>

          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.subtitle}>
            {mode === "code"
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter one of your saved recovery codes."}
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          {mode === "code" ? (
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              editable={!loading}
              placeholder="000000"
            />
          ) : (
            <TextInput
              style={styles.input}
              value={recoveryCode}
              onChangeText={setRecoveryCode}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              editable={!loading}
              placeholder="Recovery code"
            />
          )}

          <Pressable
            style={styles.button}
            onPress={handleSubmit}
            disabled={
              loading || (mode === "code" ? code.length !== 6 : !recoveryCode)
            }
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setError(null);
              setMode(mode === "code" ? "recovery" : "code");
            }}
          >
            <Text style={styles.switchModeLink}>
              {mode === "code"
                ? "Use a recovery code instead"
                : "Use authenticator code instead"}
            </Text>
          </Pressable>

          <Pressable onPress={handleBackToLogin}>
            <Text style={styles.footerLink}>Back to login</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 40, alignItems: "center" },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.tealTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "700", color: Colors.primaryDark },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 19,
  },
  error: {
    width: "100%",
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    textAlign: "center",
  },
  codeInput: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 20,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  switchModeLink: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
  },
  footerLink: { color: Colors.textMuted, fontSize: 13 },
});