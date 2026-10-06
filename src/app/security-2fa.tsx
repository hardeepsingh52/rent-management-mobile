import { RecoveryCodesReveal } from "@/components/recovery-codes-reveal";
import { TotpEnrollment } from "@/components/totp-enrollment";
import { Colors } from "@/constants/colors";
import {
    confirmAuthenticatorReplacement,
    getTwoFactorStatus,
    regenerateRecoveryCodes,
    startAuthenticatorReplacement,
} from "@/lib/auth-api";
import {
    authenticateWithBiometrics,
    isBiometricAvailable,
    saveBiometricSession,
} from "@/lib/biometric-session";
import { useSession, useSessionContext } from "@/lib/session-context";
import type { TwoFactorEnrollment, TwoFactorStatus } from "@/lib/types";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Stage =
  | "idle"
  | "regenerate-code"
  | "regenerate-codes"
  | "replace-auth"
  | "replace-enroll"
  | "replace-codes";

async function requireBiometricIfAvailable(): Promise<boolean> {
  if (!(await isBiometricAvailable())) {
    return true;
  }
  return authenticateWithBiometrics("Confirm it's you");
}

export default function SecurityTwoFactorScreen() {
  const user = useSession();
  const { signIn } = useSessionContext();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [regenCode, setRegenCode] = useState("");
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(
    null,
  );

  const [password, setPassword] = useState("");
  const [replaceMode, setReplaceMode] = useState<"code" | "recovery">("code");
  const [replaceCode, setReplaceCode] = useState("");
  const [replaceRecoveryCode, setReplaceRecoveryCode] = useState("");
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(
    null,
  );

  function loadStatus() {
    getTwoFactorStatus(user.token).then(setStatus).catch(() => {});
  }

  useEffect(loadStatus, []);

  async function startRegenerate() {
    setError(null);
    if (!(await requireBiometricIfAvailable())) {
      return;
    }
    setRegenCode("");
    setStage("regenerate-code");
  }

  async function confirmRegenerate() {
    setError(null);
    setSubmitting(true);
    try {
      const codes = await regenerateRecoveryCodes(regenCode, user.token);
      setNewRecoveryCodes(codes);
      setStage("regenerate-codes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startReplace() {
    setError(null);
    if (!(await requireBiometricIfAvailable())) {
      return;
    }
    setPassword("");
    setReplaceCode("");
    setReplaceRecoveryCode("");
    setStage("replace-auth");
  }

  async function confirmReplaceStart() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await startAuthenticatorReplacement(
        password,
        replaceMode === "code"
          ? { code: replaceCode }
          : { recoveryCode: replaceRecoveryCode },
        user.token,
      );
      setEnrollment(result);
      setStage("replace-enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReplaceEnroll(code: string) {
    setError(null);
    setSubmitting(true);
    try {
      const result = await confirmAuthenticatorReplacement(code, user.token);
      await signIn(result.session);
      try {
        if (await isBiometricAvailable()) {
          await saveBiometricSession(result.session);
        }
      } catch {
        // Biometric caching is a nice-to-have; never block on it.
      }
      setNewRecoveryCodes(result.recoveryCodes);
      setStage("replace-codes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    } finally {
      setSubmitting(false);
    }
  }

  function finishAndReset() {
    setNewRecoveryCodes(null);
    setEnrollment(null);
    setStage("idle");
    loadStatus();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {stage === "idle" && (
          <>
            <Text style={styles.title}>Two-factor authentication</Text>
            {status ? (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={styles.statusValue}>
                    {status.enabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Recovery codes left</Text>
                  <Text style={styles.statusValue}>
                    {status.recoveryCodesRemaining}
                  </Text>
                </View>
              </>
            ) : (
              <ActivityIndicator color={Colors.accentTeal} />
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.actionButton} onPress={startRegenerate}>
              <Text style={styles.actionButtonText}>
                Regenerate recovery codes
              </Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={startReplace}>
              <Text style={styles.actionButtonText}>
                Replace authenticator
              </Text>
            </Pressable>
          </>
        )}

        {stage === "regenerate-code" && (
          <>
            <Text style={styles.title}>Confirm your code</Text>
            <Text style={styles.subtitle}>
              Enter your current authenticator code to generate new recovery
              codes. Your old codes stop working immediately.
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              style={styles.codeInput}
              value={regenCode}
              onChangeText={setRegenCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!submitting}
              placeholder="000000"
            />
            <Pressable
              style={styles.button}
              onPress={confirmRegenerate}
              disabled={submitting || regenCode.length !== 6}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Confirm</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStage("idle")}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </Pressable>
          </>
        )}

        {stage === "regenerate-codes" && newRecoveryCodes && (
          <RecoveryCodesReveal
            codes={newRecoveryCodes}
            onContinue={finishAndReset}
          />
        )}

        {stage === "replace-auth" && (
          <>
            <Text style={styles.title}>Replace authenticator</Text>
            <Text style={styles.subtitle}>
              Confirm your password and current{" "}
              {replaceMode === "code" ? "authenticator code" : "recovery code"}{" "}
              to set up a new authenticator.
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              editable={!submitting}
            />
            {replaceMode === "code" ? (
              <TextInput
                style={styles.codeInput}
                value={replaceCode}
                onChangeText={setReplaceCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                editable={!submitting}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={replaceRecoveryCode}
                onChangeText={setReplaceRecoveryCode}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Recovery code"
                editable={!submitting}
              />
            )}
            <Pressable
              style={styles.button}
              onPress={confirmReplaceStart}
              disabled={
                submitting ||
                !password ||
                (replaceMode === "code"
                  ? replaceCode.length !== 6
                  : !replaceRecoveryCode)
              }
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() =>
                setReplaceMode(replaceMode === "code" ? "recovery" : "code")
              }
            >
              <Text style={styles.switchModeLink}>
                {replaceMode === "code"
                  ? "Use a recovery code instead"
                  : "Use authenticator code instead"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setStage("idle")}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </Pressable>
          </>
        )}

        {stage === "replace-enroll" && enrollment && (
          <TotpEnrollment
            enrollment={enrollment}
            onSubmitCode={confirmReplaceEnroll}
            submitting={submitting}
            error={error}
            submitLabel="Confirm"
          />
        )}

        {stage === "replace-codes" && newRecoveryCodes && (
          <RecoveryCodesReveal
            codes={newRecoveryCodes}
            onContinue={finishAndReset}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 19,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  statusLabel: { fontSize: 13, color: Colors.textMuted },
  statusValue: { fontSize: 13, fontWeight: "700", color: Colors.primaryDark },
  error: {
    width: "100%",
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
    fontSize: 14,
    textAlign: "center",
  },
  actionButton: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.accentTeal,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
  },
  codeInput: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 16,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  switchModeLink: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 16,
  },
  cancelLink: { color: Colors.textMuted, fontSize: 13 },
});