import { api } from "./axios";
import type { Booking, BookingMessage } from "../types";

export type BookingNegotiation = {
  id: number;
  booking?: number;
  proposed_price: string;
  message: string;
  status: "OPEN" | "ACCEPTED" | "REJECTED";
  proposed_by?: number;
  proposed_by_username?: string;
  created_at?: string;
};

export type CreateNegotiationPayload = {
  proposed_price: string;
  message?: string;
};

export type BookingEvent = {
  id: number;
  booking: number;
  event_type: string;
  actor: number | null;
  actor_username?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
};

export type CreateBookingPayload = {
  service?: number;
  package?: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
};

export async function createBooking(
  payload: CreateBookingPayload
): Promise<Booking> {
  const { data } = await api.post<Booking>("/api/bookings/create/", payload);
  return data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>("/api/bookings/my/");
  return data;
}

export async function getAvailableJobs(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>("/api/bookings/available/");
  return data;
}

export async function claimJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(`/api/bookings/${id}/claim/`);
  return data;
}

export async function createNegotiation(
  bookingId: number,
  payload: CreateNegotiationPayload
): Promise<BookingNegotiation> {
  const { data } = await api.post<BookingNegotiation>(
    `/api/bookings/${bookingId}/negotiate/`,
    payload
  );
  return data;
}

export async function startJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(`/api/bookings/${id}/start/`);
  return data;
}

export async function completeJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(`/api/bookings/${id}/complete/`);
  return data;
}

export async function cancelBooking(bookingId: number): Promise<any> {
  const { data } = await api.post(`/api/bookings/${bookingId}/cancel/`);
  return data;
}

export async function getBookingMessages(
  bookingId: number
): Promise<BookingMessage[]> {
  const { data } = await api.get<BookingMessage[]>(
    `/api/bookings/${bookingId}/messages/`
  );
  return data;
}

export async function sendBookingMessage(
  bookingId: number,
  payload: {
    message?: string;
    proposed_price?: string;
  }
): Promise<BookingMessage> {
  const { data } = await api.post<BookingMessage>(
    `/api/bookings/${bookingId}/messages/send/`,
    payload
  );
  return data;
}

export async function getBookingDetail(id: number): Promise<Booking> {
  const { data } = await api.get<Booking>(`/api/bookings/${id}/`);
  return data;
}