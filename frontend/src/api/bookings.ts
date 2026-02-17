import { api } from "./axios";
import type { Booking } from "../types";

export async function createBooking(payload: {
  service: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
}) {
  const { data } = await api.post<Booking>("/api/bookings/create/", payload);
  return data;
}

export async function getMyBookings() {
  const { data } = await api.get<Booking[]>("/api/bookings/my/");
  return data;
}

export async function getAvailableJobs() {
  const { data } = await api.get<Booking[]>("/api/bookings/available/");
  return data;
}

export async function acceptJob(id: number) {
  const { data } = await api.post<Booking>(`/api/bookings/${id}/accept/`);
  return data;
}

export async function updateBookingStatus(
  id: number,
  status: Booking["status"]
) {
  const { data } = await api.patch<Booking>(
    `/api/bookings/${id}/status/`,
    { status }
  );
  return data;
}