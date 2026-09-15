import { Colors } from "@/constants/colors";
import { register } from "@/lib/auth-api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
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

type UserType = "Landlord" | "Contractor";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!userType) {
      setError("Please select whether you're a landlord or contractor.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        userType,
      });
      router.replace({ pathname: "/login", params: { registered: "1" } });
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
              source={require("@/assets/images/domuspro-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Set up your account to start managing properties and leases.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={Colors.textMutedDark}
            />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              editable={!loading}
              placeholder="Jane Smith"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={Colors.textMutedDark}
            />
            <TextInput
              ref={emailRef}
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
              color={Colors.textMutedDark}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={Colors.textMutedDark}
              />
            </Pressable>
          </View>

          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {(["Landlord", "Contractor"] as const).map((type) => {
              const selected = userType === type;
              return (
                <Pressable
                  key={type}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}
                  onPress={() => setUserType(type)}
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name={type === "Landlord" ? "home-account" : "hammer-wrench"}
                    size={18}
                    color={selected ? Colors.accentOrange : Colors.textMuted}
                  />
                  <Text
                    style={[styles.roleText, selected && styles.roleTextSelected]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </Pressable>

          <Link href="/login" style={styles.footerLink}>
            Already have an account? Log in
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoWrap: { alignItems: "center", marginBottom: 20 },
  logo: { width: 200, height: 100, borderRadius: 20 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.primaryDark },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 19,
  },
  error: {
    backgroundColor: Colors.errorBg,
    color: Colors.errorText,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  label: { fontSize: 13, fontWeight: "600", color: Colors.primaryDark },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 18,
  },
  input: { flex: 1, paddingVertical: 15, fontSize: 14 },
  roleRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 22 },
  roleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  roleCardSelected: {
    backgroundColor: Colors.orangeTint,
    borderColor: Colors.accentOrange,
  },
  roleText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  roleTextSelected: { color: Colors.accentOrange },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accentOrange,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 8,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  footerLink: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 18,
  },
});
