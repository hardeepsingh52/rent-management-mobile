import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { SessionUser } from "./types";

const SESSION_KEY = "session_user";

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveSession(user: SessionUser): Promise<void> {
  await setItem(SESSION_KEY, JSON.stringify(user));
}

export async function getSession(): Promise<SessionUser | null> {
  const raw = await getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export async function clearSession(): Promise<void> {
  await removeItem(SESSION_KEY);
}
