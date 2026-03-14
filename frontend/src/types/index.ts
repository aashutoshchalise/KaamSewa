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
  | "CLAIMED"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "REJECTED";

export type Booking = {
  id: number;
  client: number;
  worker: number | null;
  service: number | null;
  package?: number | null;
  service_name: string | null;
  package_name?: string | null;
  service_price: string | null;
  service_pricing_unit: "HOUR" | "FIXED" | null;
  address: string;
  notes: string;
  scheduled_at: string | null;
  final_price?: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  pricing_unit: string;
  image?: string | null;
};