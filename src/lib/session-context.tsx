import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import { setUnauthorizedHandler } from "./api-client";
import { clearBiometricSession } from "./biometric-session";
import { clearSession, getSession, saveSession } from "./session";
import type { SessionUser } from "./types";

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  signIn: (user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
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

  async function signOut() {
    await clearSession();
    if (Platform.OS !== "web") {
      await clearBiometricSession();
    }
    setUser(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, []);

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
