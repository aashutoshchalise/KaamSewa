import axios from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL =
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ??
  "http://192.168.1.135:8001"; // <-- your laptop IP

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================
// Token helpers
// =======================
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function setTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, access],
    [REFRESH_KEY, refresh],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

// =======================
// Attach token to requests
// =======================
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =======================
// Refresh token flow
// =======================
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as any;

    if (!error.response) throw error;

    if (error.response.status !== 401 || original._retry) {
      throw error;
    }

    original._retry = true;

    const refresh = await getRefreshToken();
    if (!refresh) {
      await clearTokens();
      throw error;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) return reject(error);
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const resp = await axios.post(`${baseURL}/api/auth/refresh/`, {
        refresh,
      });

      const newAccess = resp.data.access as string;
      await AsyncStorage.setItem(ACCESS_KEY, newAccess);

      pendingQueue.forEach((cb) => cb(newAccess));
      pendingQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      pendingQueue.forEach((cb) => cb(null));
      pendingQueue = [];
      await clearTokens();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);