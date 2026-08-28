import { useEffect, useRef, useState } from "react";
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
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { login } from "@/lib/auth-api";
import { useSessionContext } from "@/lib/session-context";
import {
  authenticateWithBiometrics,
  getBiometricSession,
  isBiometricAvailable,
  saveBiometricSession,
} from "@/lib/biometric-session";

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#1565c0", "#0c447c"]} style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="office-building"
            size={26}
            color="#fff"
          />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Log in to manage your properties, tenants, and leases.
        </Text>
      </LinearGradient>

      <View style={styles.content}>
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

        <Text style={styles.label}>Password</Text>
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

        <Link href="/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>

        <Pressable
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
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
                <ActivityIndicator color="#1565c0" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={18}
                    color="#1565c0"
                  />
                  <Text style={styles.biometricButtonText}>
                    Log in with Face ID
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "600", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 6 },
  content: { padding: 24 },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#111", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 14 },
  forgotLink: {
    textAlign: "right",
    color: "#1565c0",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1565c0",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "500", fontSize: 15 },
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
    borderRadius: 12,
    paddingVertical: 14,
  },
  biometricButtonText: { fontSize: 14, fontWeight: "500", color: "#111" },
});
