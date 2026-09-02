import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { setTokenRefreshHandler, setUnauthorizedHandler } from "./api-client";
import { refreshAccessToken as apiRefreshAccessToken, logout } from "./auth-api";
import {
  clearBiometricSession,
  isBiometricAvailable,
  saveBiometricSession,
} from "./biometric-session";
import { clearSession, getSession, saveSession } from "./session";
import type { SessionUser } from "./types";

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (user: SessionUser) => Promise<void>;
  signOut: (reason?: "manual" | "expired") => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      setUser(session);
      setLoading(false);
    });
  }, []);

  async function signIn(newUser: SessionUser) {
    await saveSession(newUser);
    setUser(newUser);
  }

  async function signOut(reason: "manual" | "expired" = "manual") {
    // A manual sign-out only clears the local session, leaving the server-side
    // refresh token and biometric cache intact so Face ID can log back in
    // instantly. An expired/invalid session (reactive sign-out) revokes the
    // refresh token and clears the biometric cache too, since there's no valid
    // session left for Face ID to restore.
    if (reason === "expired" && user) {
      await logout(user.refreshToken);
    }
    await clearSession();
    if (reason === "expired" && Platform.OS !== "web") {
      await clearBiometricSession();
    }
    setUser(null);
  }

  async function refreshAccessToken(): Promise<string> {
    if (!user) {
      throw new Error("No active session to refresh.");
    }
    const refreshed = await apiRefreshAccessToken(user.refreshToken);
    await saveSession(refreshed);
    if (Platform.OS !== "web" && (await isBiometricAvailable())) {
      await saveBiometricSession(refreshed);
    }
    setUser(refreshed);
    return refreshed.token;
  }

  useEffect(() => {
    setUnauthorizedHandler(() => signOut("expired"));
    setTokenRefreshHandler(refreshAccessToken);
  }, [user]);

  return (
    <SessionContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return ctx;
}

export function useSession(): SessionUser {
  const { user } = useSessionContext();
  if (!user) {
    throw new Error("useSession must be used within an authenticated route");
  }
  return user;
}