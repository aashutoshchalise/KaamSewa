// ===== USER =====
export type Role = "ADMIN" | "WORKER" | "CLIENT";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  is_worker_approved?: boolean;
  is_staff?: boolean;
}

// ===== SERVICE =====
export interface Service {
  id: number;
  name: string;
  description?: string;
  base_price: string;
  pricing_unit: "HOUR" | "FIXED";
}

// ===== BOOKING =====
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export interface Booking {
  id: number;
  client: number;
  worker: number | null;
  service: number;
  service_name: string;
  service_price: string;
  service_pricing_unit: "HOUR" | "FIXED";
  address: string;
  notes?: string;
  scheduled_at?: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}