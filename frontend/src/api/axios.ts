import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = "http://192.168.1.144:8001"; // YOUR IP

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================
// Token helpers
// =======================
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const getAccessToken = () =>
  AsyncStorage.getItem(ACCESS_KEY);

export const getRefreshToken = () =>
  AsyncStorage.getItem(REFRESH_KEY);

export const setTokens = async (access: string, refresh: string) => {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access],
    [REFRESH_KEY, refresh],
  ]);
};

export const clearTokens = () =>
  AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);

// =======================
// Attach token
// =======================
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});