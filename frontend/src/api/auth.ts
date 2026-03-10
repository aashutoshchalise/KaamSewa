import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from "./axios";
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

export type RegisterPayload = {
  username: string;
  password: string;
  role: "CLIENT" | "WORKER";
};

export type MeResponse = User;

export async function login(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>("/api/auth/login/", payload);
  await setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post("/api/register/", payload);
  return data;
}

export async function meApi(): Promise<MeResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token");

  const { data } = await api.get<MeResponse>("/api/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

export { setTokens, clearTokens, getAccessToken, getRefreshToken };

export function normalizeRole(roleRaw?: string): Role | null {
  if (!roleRaw) return null;
  const r = roleRaw.toUpperCase().trim();
  if (r === "ADMIN" || r === "WORKER" || r === "CLIENT") return r;
  if (r.includes("ADMIN")) return "ADMIN";
  if (r.includes("WORKER")) return "WORKER";
  if (r.includes("CLIENT")) return "CLIENT";
  return null;
}