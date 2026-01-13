import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi, me as meApi } from "../api/auth";
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
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<User["role"] | null>(null);
  const [booting, setBooting] = useState(true);

  async function refreshMe() {
    const me = await meApi();
    setUser(me);
    setRole(me.role);
  }

  async function login(username: string, password: string) {
    const tokens = await loginApi({ username, password });
    await AsyncStorage.setItem("access_token", tokens.access);
    await AsyncStorage.setItem("refresh_token", tokens.refresh);
    await refreshMe();
  }

  async function logout() {
    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
    setUser(null);
    setRole(null);
  }

  useEffect(() => {
    (async () => {
      try {
        const access = await AsyncStorage.getItem("access_token");
        if (access) await refreshMe();
      } catch {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ user, role, booting, login, logout, refreshMe }),
    [user, role, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}