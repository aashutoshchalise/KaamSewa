import { api } from "./axios";
import type { Booking } from "../types";

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


export async function createBooking(payload: {
  service: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
}) {
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


export async function acceptNegotiation(
  negotiationId: number
): Promise<Booking> {
  const { data } = await api.post<Booking>(
    `/api/bookings/negotiation/${negotiationId}/accept/`
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


export async function updateBookingStatus(
  id: number,
  status: Booking["status"]
): Promise<Booking> {
  const { data } = await api.patch<Booking>(`/api/bookings/${id}/status/`, {
    status,
  });
  return data;
}


export async function getBookingEvents(id: number): Promise<BookingEvent[]> {
  const { data } = await api.get<BookingEvent[]>(`/api/bookings/${id}/events/`);
  return data;
}


export async function cancelBooking(bookingId: number) {
  const res = await api.post(`/api/bookings/${bookingId}/cancel/`);
  return res.data;
}