import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL =
  "https://astounding-dextrorsely-chiquita.ngrok-free.dev";

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const ACCESS_KEY = "access_token";

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});