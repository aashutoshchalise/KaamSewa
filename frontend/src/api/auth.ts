import { api } from "./axios";
import {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "./axios";
import type { User } from "../types";

/* =========================
   TYPES
========================= */

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

  //  worker-only fields
  khalti_number?: string;
  bank_account_number?: string;
};

export type UpdateProfilePayload = {
  username?: string;
  email?: string;
  phone?: string;
};

export type MeResponse = User;

/* =========================
   AUTH API
========================= */

//  LOGIN
export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await api.post("/api/auth/login/", payload);

  //  store tokens immediately
  await setTokens(res.data.access, res.data.refresh);

  return res.data;
};

//  REGISTER
export const register = async (payload: RegisterPayload) => {
  const res = await api.post("/api/auth/register/", payload);
  return res.data;
};

//  GET CURRENT USER
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

//  UPDATE PROFILE
export const updateProfileApi = async (
  payload: UpdateProfilePayload
): Promise<MeResponse> => {
  const res = await api.patch<MeResponse>(
    "/api/auth/me/update/",
    payload
  );

  return res.data;
};

//  LOGOUT
export const logout = async () => {
  await clearTokens();
};

/* =========================
   HELPERS
========================= */

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