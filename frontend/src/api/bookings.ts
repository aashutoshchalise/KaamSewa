import { api } from "./axios";
import type { Booking } from "../types";

/**
 * CLIENT — create booking
 */
export async function createBooking(payload: {
  service: number;
  address: string;
  notes?: string;
  scheduled_at?: string | null;
}) {
  const { data } = await api.post<Booking>(
    "/api/bookings/create/",
    payload
  );
  return data;
}

/**
 * CLIENT or WORKER — get own bookings
 */
export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>(
    "/api/bookings/my/"
  );
  return data;
}

/**
 * WORKER — see available jobs
 */
export async function getAvailableJobs(): Promise<Booking[]> {
  const { data } = await api.get<Booking[]>(
    "/api/bookings/available/"
  );
  return data;
}

/**
 * WORKER — claim booking
 */
export async function claimJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(
    `/api/bookings/${id}/claim/`
  );
  return data;
}

/**
 * WORKER — start job
 */
export async function startJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(
    `/api/bookings/${id}/start/`
  );
  return data;
}

/**
 * WORKER — complete job
 */
export async function completeJob(id: number): Promise<Booking> {
  const { data } = await api.post<Booking>(
    `/api/bookings/${id}/complete/`
  );
  return data;
}

/**
 * CLIENT — cancel booking
 * ADMIN — any transition
 */
export async function updateBookingStatus(
  id: number,
  status: Booking["status"]
): Promise<Booking> {
  const { data } = await api.patch<Booking>(
    `/api/bookings/${id}/status/`,
    { status }
  );
  return data;
}