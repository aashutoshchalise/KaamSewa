import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, me, logout as apiLogout } from "../api/auth";
import type { User } from "../types";

export type Role = User["role"]; // expects your User type has: role: "CLIENT" | "WORKER" | "ADMIN" (or similar)

type AuthState = {
  user: User | null;
  role: Role | null;
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
  const [role, setRole] = useState<Role | null>(null);
  const [booting, setBooting] = useState(true);

  async function refreshMe() {
    const profile = await me();
    setUser(profile);
    setRole(profile.role as Role);
  }

  async function handleLogin(username: string, password: string) {
    // login() already stores tokens via setTokens() inside api/auth.ts
    await login({ username, password });
    await refreshMe();
  }

  async function handleLogout() {
    await apiLogout(); // clears tokens via clearTokens() in api/auth.ts
    setUser(null);
    setRole(null);
  }

  useEffect(() => {
    (async () => {
      try {
        const access = await AsyncStorage.getItem("access_token");
        if (access) {
          await refreshMe();
        }
      } catch {
        await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      booting,
      login: handleLogin,
      logout: handleLogout,
      refreshMe,
    }),
    [user, role, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}