import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { User } from "../types";

export type Role = "ADMIN" | "WORKER" | "CLIENT";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type MeResponse = User;

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

/**
 * Run: ipconfig getifaddr en0
 */
const DEVICE_IP = "192.168.1.171";

/**
 * Environment-safe BASE_URL
 */
const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8001" // Android emulator
    : __DEV__
    ? `http://${DEVICE_IP}:8001` // iOS physical device (Expo Go)
    : "http://127.0.0.1:8001"; // fallback (simulator)

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

export async function setTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access],
    [REFRESH_KEY, refresh],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function login(payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>("/api/auth/login/", payload);
  await setTokens(data.access, data.refresh);
  return data;
}

export async function meApi(): Promise<MeResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token");

  const { data } = await http.get<MeResponse>("/api/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

export function normalizeRole(roleRaw?: string): Role | null {
  if (!roleRaw) return null;
  const r = roleRaw.toUpperCase().trim();
  if (r === "ADMIN" || r === "WORKER" || r === "CLIENT") return r;
  if (r.includes("ADMIN")) return "ADMIN";
  if (r.includes("WORKER")) return "WORKER";
  if (r.includes("CLIENT")) return "CLIENT";
  return null;
}