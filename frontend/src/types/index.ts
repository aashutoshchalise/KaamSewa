export type Role = "ADMIN" | "WORKER" | "CLIENT";

export type User = {
  id: number | string;
  username: string;
  email?: string;
  phone?: string | null;
  role: Role;
  is_worker_approved?: boolean;
  is_staff?: boolean;
};

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export type Booking = {
  id: number;
  client: number;
  worker: number | null;
  service: number;
  service_name: string;
  service_price: string;
  service_pricing_unit: "HOUR" | "FIXED";
  address: string;
  notes: string;
  scheduled_at: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: number;
  name: string;
  description?: string;
  base_price: string;
  pricing_unit: "HOUR" | "FIXED";
  is_active?: boolean;
};