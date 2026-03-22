import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi, meApi } from "../api/auth";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  role: User["role"] | null;
  booting: boolean;
};

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<User["role"] | null>(null);
  const [booting, setBooting] = useState(true);

  const initializing = useRef(false);

  async function refreshMe() {
    try {
      const me = await meApi();

      setUser(me);
      setRole(me.role);
    } catch {
      await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      setUser(null);
      setRole(null);
    }
  }

  async function login(username: string, password: string) {
    await loginApi({ username, password });
    await refreshMe();
  }

  async function logout() {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
    setRole(null);
  }

  useEffect(() => {
    if (initializing.current) return;

    initializing.current = true;

    (async () => {
      try {
        const access = await AsyncStorage.getItem("access_token");
        if (access) {
          await refreshMe();
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ user, role, booting, login, logout, refreshMe, setUser }),
    [user, role, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}