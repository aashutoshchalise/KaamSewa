import { api } from "./axios";
import type { Booking } from "../types";

export type CreateServiceBookingPayload = {
  service_id: number;
  scheduled_at: string; // ISO string
  address: string;
  notes?: string;
};

export async function createServiceBooking(payload: CreateServiceBookingPayload) {
  const { data } = await api.post<Booking>("/api/bookings/service", payload);
  return data;
}

export async function myBookings() {
  const { data } = await api.get<Booking[]>("/api/bookings/my");
  return data;
}

export async function bookingDetail(id: string | number) {
  const { data } = await api.get<Booking>(`/api/bookings/${id}`);
  return data;
}