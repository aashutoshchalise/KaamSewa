import axios from "axios";
import { getAccessToken } from "./auth";
import type { Booking, BookingStatus } from "../types";

const BASE_URL = "http://10.0.2.2:8001"; // android emulator
// If you run on iOS simulator or real device later, we can make this dynamic.

async function authHeader() {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token");
  return { Authorization: `Bearer ${token}` };
}

export async function createBooking(payload: {
  service: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
}) {
  const headers = await authHeader();
  const { data } = await axios.post<Booking>(
    `${BASE_URL}/api/bookings/create/`,
    payload,
    { headers }
  );
  return data;
}

export async function myBookings() {
  const headers = await authHeader();
  const { data } = await axios.get<Booking[]>(
    `${BASE_URL}/api/bookings/my/`,
    { headers }
  );
  return data;
}

export async function availableBookings() {
  const headers = await authHeader();
  const { data } = await axios.get<Booking[]>(
    `${BASE_URL}/api/bookings/available/`,
    { headers }
  );
  return data;
}

export async function acceptBooking(id: number) {
  const headers = await authHeader();
  const { data } = await axios.post<Booking>(
    `${BASE_URL}/api/bookings/${id}/accept/`,
    {},
    { headers }
  );
  return data;
}

export async function updateBookingStatus(id: number, status: BookingStatus) {
  const headers = await authHeader();
  const { data } = await axios.patch<Booking>(
    `${BASE_URL}/api/bookings/${id}/status/`,
    { status },
    { headers }
  );
  return data;
}