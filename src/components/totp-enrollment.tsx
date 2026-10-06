import { Colors } from "@/constants/colors";
import type { TwoFactorEnrollment } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

export function TotpEnrollment({
  enrollment,
  onSubmitCode,
  submitting,
  error,
  submitLabel = "Enable",
}: {
  enrollment: TwoFactorEnrollment;
  onSubmitCode: (code: string) => void;
  submitting: boolean;
  error: string | null;
  submitLabel?: string;
}) {
  const [code, setCode] = useState("");
  const [keyCopied, setKeyCopied] = useState(false);

  async function handleCopyKey() {
    await Clipboard.setStringAsync(enrollment.sharedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.instructions}>
        Scan this QR code with an authenticator app (Google Authenticator,
        Authy, 1Password, etc.)
      </Text>

      <View style={styles.qrWrap}>
        <QRCode value={enrollment.authenticatorUri} size={200} />
      </View>

      <Text style={styles.orText}>Or enter this key manually:</Text>
      <Pressable style={styles.keyRow} onPress={handleCopyKey}>
        <Text style={styles.keyText} selectable>
          {enrollment.sharedKey}
        </Text>
        <Text style={styles.copyHint}>
          {keyCopied ? "Copied" : "Tap to copy"}
        </Text>
      </Pressable>

      <Text style={styles.instructions}>
        Then enter the 6-digit code it shows:
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.codeInput}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        editable={!submitting}
        placeholder="000000"
      />

      <Pressable
        style={styles.button}
        onPress={() => onSubmitCode(code)}
        disabled={submitting || code.length !== 6}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  instructions: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 19,
  },
  qrWrap: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  orText: { fontSize: 12, color: Colors.textMutedDark, marginBottom: 8 },
  keyRow: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  keyText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryDark,
    letterSpacing: 1,
    marginBottom: 4,
  },
  copyHint: { fontSize: 11, color: Colors.accentTeal },
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
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});