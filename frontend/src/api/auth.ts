import { api, setTokens, clearTokens } from "./axios";
import type { User } from "../types";

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
  email?: string;
  password: string;
  password2: string;
};

export async function login(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>("/api/auth/login/", payload);
  await setTokens(data.access, data.refresh);
  return data;
}

export async function registerClient(payload: RegisterPayload) {
  const { data } = await api.post<any>("/api/auth/register/", payload);

  // If backend returns tokens on register, store them
  if (data?.access && data?.refresh) {
    await setTokens(data.access, data.refresh);
  }

  return data;
}

export async function me() {
  const { data } = await api.get<User>("/api/me/");
  return data;
}

export async function logout() {
  await clearTokens();
}


import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "access_token";

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}