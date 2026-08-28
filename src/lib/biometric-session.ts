import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { SessionUser } from "./types";

const BIOMETRIC_KEY = "biometric_session";

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function saveBiometricSession(user: SessionUser): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, JSON.stringify(user));
}

export async function getBiometricSession(): Promise<SessionUser | null> {
  const raw = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export async function clearBiometricSession(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Log in to DomusPRO",
  });
  return result.success;
}
