import axios from "axios";
import { Platform } from "react-native";
import type { Booking } from "../types";
import { getAccessToken } from "./auth";

const DEVICE_IP = "192.168.1.144";
const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8001" : "http://127.0.0.1:8001";
// For physical phone, use:
// const BASE_URL = `http://${DEVICE_IP}:8001`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

async function authHeader() {
  const token = await getAccessToken();
  if (!token) throw new Error("Not logged in");
  return { Authorization: `Bearer ${token}` };
}

export async function createBooking(payload: {
  service: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
}) {
  const headers = await authHeader();
  const { data } = await api.post<Booking>("/api/bookings/create/", payload, { headers });
  return data;
}

export async function getMyBookings() {
  const headers = await authHeader();
  const { data } = await api.get<Booking[]>("/api/bookings/my/", { headers });
  return data;
}

export async function getAvailableJobs() {
  const headers = await authHeader();
  const { data } = await api.get<Booking[]>("/api/bookings/available/", { headers });
  return data;
}

export async function acceptJob(id: number) {
  const headers = await authHeader();
  const { data } = await api.post<Booking>(`/api/bookings/${id}/accept/`, null, { headers });
  return data;
}

export async function updateBookingStatus(id: number, status: Booking["status"]) {
  const headers = await authHeader();
  const { data } = await api.patch<Booking>(
    `/api/bookings/${id}/status/`,
    { status },
    { headers }
  );
  return data;
}