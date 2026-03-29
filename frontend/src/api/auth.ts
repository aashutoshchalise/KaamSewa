import { api } from "./axios";
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "./axios";
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
  phone: string;
  role: "CLIENT" | "WORKER";
  khalti_number?: string;
  bank_account_number?: string;
};

export type UpdateProfilePayload = {
  username?: string;
  email?: string;
  phone?: string;
  khalti_number?: string;
  bank_account_number?: string;
};

export type MeResponse = User & {
  khalti_number?: string | null;
  bank_account_number?: string | null;
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await api.post("/api/auth/login/", payload);
  await setTokens(res.data.access, res.data.refresh);
  return res.data;
};

export const register = async (payload: RegisterPayload) => {
  const res = await api.post("/api/auth/register/", payload);
  return res.data;
};

export const meApi = async (): Promise<MeResponse> => {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token");

  const res = await api.get<MeResponse>("/api/auth/me/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const updateProfileApi = async (
  payload: UpdateProfilePayload
): Promise<MeResponse> => {
  const res = await api.patch<MeResponse>("/api/auth/me/update/", payload);
  return res.data;
};

export const logout = async () => {
  await clearTokens();
};

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