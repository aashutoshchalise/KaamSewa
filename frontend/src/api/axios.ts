import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = "http://192.168.1.172:8001"; // <-- make sure this is your CURRENT IP

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

export const getAccessToken = () => AsyncStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => AsyncStorage.getItem(REFRESH_KEY);

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

  // ✅ DEBUG LOG
  console.log(
    "➡️ API REQUEST:",
    config.method?.toUpperCase(),
    (config.baseURL || "") + (config.url || "")
  );

  return config;
});

// ✅ DEBUG LOG responses + errors
api.interceptors.response.use(
  (res) => {
    console.log(
      "✅ API RESPONSE:",
      res.status,
      res.config.method?.toUpperCase(),
      (res.config.baseURL || "") + (res.config.url || "")
    );
    return res;
  },
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const url = (err?.config?.baseURL || "") + (err?.config?.url || "");
    console.log("❌ API ERROR:", status, url, data || err.message);
    return Promise.reject(err);
  }
);