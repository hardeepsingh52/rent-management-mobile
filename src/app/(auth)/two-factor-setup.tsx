import { RecoveryCodesReveal } from "@/components/recovery-codes-reveal";
import { TotpEnrollment } from "@/components/totp-enrollment";
import { Colors } from "@/constants/colors";
import { beginTwoFactorSetup, enableTwoFactor } from "@/lib/auth-api";
import {
  isBiometricAvailable,
  saveBiometricSession,
} from "@/lib/biometric-session";
import { useSessionContext } from "@/lib/session-context";
import {
  clearPendingTwoFactorToken,
  getPendingTwoFactorToken,
} from "@/lib/two-factor-handoff";
import type {
  SessionUser,
  TwoFactorEnrollment as TwoFactorEnrollmentType,
} from "@/lib/types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TwoFactorSetupScreen() {
  const router = useRouter();
  const { signIn } = useSessionContext();
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollmentType | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [pendingSession, setPendingSession] = useState<SessionUser | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);

useEffect(() => {
  const pending = getPendingTwoFactorToken();
  if (!pending) {
    router.replace("/(auth)/login");
    return;
  }
  beginTwoFactorSetup(pending)
    .then(setEnrollment)
    .catch((err) => {
      setError(err instanceof Error ? err.message : "Could not start setup.");
    })
    .finally(() => setLoadingEnrollment(false));
}, []);

 async function handleEnableCode(code: string) {
  const token = getPendingTwoFactorToken();
  if (!token) {
    return;
  }
  setError(null);
  setSubmitting(true);
  try {
    const result = await enableTwoFactor(token, code);
    setPendingSession(result.session);
    setRecoveryCodes(result.recoveryCodes);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
  } finally {
    setSubmitting(false);
  }
}

  async function handleContinue() {
    if (!pendingSession) {
      return;
    }
    clearPendingTwoFactorToken();
    await signIn(pendingSession);
    try {
      if (await isBiometricAvailable()) {
        await saveBiometricSession(pendingSession);
      }
    } catch {
      // Biometric caching is a nice-to-have; never block a successful login on it.
    }
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Set up two-factor authentication</Text>
        <Text style={styles.subtitle}>
          Required to keep your account secure.
        </Text>

        {loadingEnrollment ? (
          <ActivityIndicator
            color={Colors.accentTeal}
            style={{ marginTop: 40 }}
          />
        ) : recoveryCodes && pendingSession ? (
          <RecoveryCodesReveal codes={recoveryCodes} onContinue={handleContinue} />
        ) : enrollment ? (
          <TotpEnrollment
            enrollment={enrollment}
            onSubmitCode={handleEnableCode}
            submitting={submitting}
            error={error}
            submitLabel="Enable"
          />
        ) : (
          <Text style={styles.error}>{error}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primaryDark,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
    marginBottom: 28,
    textAlign: "center",
  },
  error: {
    width: "100%",
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    textAlign: "center",
  },
});