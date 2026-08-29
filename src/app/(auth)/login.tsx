import { login } from "@/lib/auth-api";
import {
  authenticateWithBiometrics,
  getBiometricSession,
  isBiometricAvailable,
  saveBiometricSession,
} from "@/lib/biometric-session";
import { useSessionContext } from "@/lib/session-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSessionContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const cached = available ? await getBiometricSession() : null;
      setShowBiometric(available && cached !== null);
    })();
  }, []);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      await signIn(user);
      try {
        if (await isBiometricAvailable()) {
          await saveBiometricSession(user);
        }
      } catch {
        // Biometric caching is a nice-to-have; never block a successful login on it.
      }
      router.replace("/");
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

  async function handleBiometricLogin() {
    setError(null);
    setBiometricLoading(true);
    try {
      const ok = await authenticateWithBiometrics();
      if (!ok) {
        return;
      }
      const cached = await getBiometricSession();
      if (!cached) {
        setShowBiometric(false);
        return;
      }
      await signIn(cached);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Face ID login failed. Please log in with your password.",
      );
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/domouspro-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>
            Log in to manage your properties, tenants, and leases.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color="#5f5e5a"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
              placeholder="name@company.com"
            />
          </View>

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <Link href="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </View>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={18}
              color="#5f5e5a"
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color="#5f5e5a"
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="login-variant"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Log in</Text>
              </>
            )}
          </Pressable>

          {showBiometric && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={biometricLoading}
              >
                {biometricLoading ? (
                  <ActivityIndicator color="#2f8a75" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={18}
                      color="#2f8a75"
                    />
                    <Text style={styles.biometricButtonText}>
                      Log in with Face ID
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoWrap: { alignItems: "center", marginBottom: 28 },
  logo: { width: 250, height: 125, borderRadius: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#16302b" },
  subtitle: {
    fontSize: 13,
    color: "#8a8fa8",
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 19,
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#16302b" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f5f6fa",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 18,
  },
  input: { flex: 1, paddingVertical: 15, fontSize: 14 },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    color: "#2f8a75",
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#d9601f",
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
    marginBottom: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e5e5" },
  dividerText: { fontSize: 11, color: "#5f5e5a" },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 28,
    paddingVertical: 14,
  },
  biometricButtonText: { fontSize: 14, fontWeight: "500", color: "#16302b" },
});