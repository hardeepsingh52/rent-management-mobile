import { Colors } from "@/constants/colors";
import * as Clipboard from "expo-clipboard";
import * as ScreenCapture from "expo-screen-capture";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function RecoveryCodesReveal({
  codes,
  onContinue,
}: {
  codes: string[];
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  async function handleCopy() {
    await Clipboard.setStringAsync(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Save your recovery codes</Text>
      <Text style={styles.subtitle}>
        Each code can be used once to sign in if you lose access to your
        authenticator app. Store them somewhere safe — they won&apos;t be
        shown again.
      </Text>

      <Pressable style={styles.codesBox} onPress={() => setRevealed((v) => !v)}>
        {codes.map((c, i) => (
          <Text key={i} style={styles.codeText}>
            {revealed ? c : "•".repeat(c.length)}
          </Text>
        ))}
        {!revealed && <Text style={styles.revealHint}>Tap to reveal</Text>}
      </Pressable>

      <Pressable style={styles.copyButton} onPress={handleCopy}>
        <Text style={styles.copyButtonText}>
          {copied ? "Copied" : "Copy all codes"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.ackRow}
        onPress={() => setAcknowledged((v) => !v)}
      >
        <View
          style={[styles.checkbox, acknowledged && styles.checkboxChecked]}
        />
        <Text style={styles.ackText}>
          I&apos;ve saved these codes somewhere safe
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, !acknowledged && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={!acknowledged}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 19,
  },
  codesBox: {
    width: "100%",
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    alignItems: "center",
  },
  codeText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primaryDark,
    letterSpacing: 2,
    marginBottom: 6,
  },
  revealHint: { fontSize: 12, color: Colors.accentTeal, marginTop: 6 },
  copyButton: { alignSelf: "center", marginBottom: 20 },
  copyButtonText: {
    color: Colors.accentTeal,
    fontSize: 13,
    fontWeight: "600",
  },
  ackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    width: "100%",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.borderMedium,
  },
  checkboxChecked: {
    backgroundColor: Colors.accentTeal,
    borderColor: Colors.accentTeal,
  },
  ackText: { fontSize: 13, color: Colors.primaryDark, flex: 1 },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});