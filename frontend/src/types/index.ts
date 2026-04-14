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
  client_username?: string | null;
  client_phone?: string | null;

  worker: number | null;
  worker_username?: string | null;
  worker_phone?: string | null;
  worker_avg_rating?: number | null;
  worker_review_count?: number;

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

  negotiation_id?: number | null;
  negotiated_price?: string | null;
  negotiation_message?: string | null;
  negotiation_status?: string | null;
  negotiation_proposed_by?: number | null;
  negotiation_proposed_by_username?: string | null;

  review_id?: number | null;
  review_rating?: number | null;
  review_comment?: string | null;
  review_created_at?: string | null;
  review_client_username?: string | null;

  created_at: string;
  updated_at: string;
};

export type BookingMessage = {
  id: number;
  booking: number;
  sender: number;
  sender_name: string;
  message: string;
  proposed_price?: string | null;
  created_at: string;
  is_me: boolean;
};

export type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  pricing_unit: string;
  image?: string | null;
};

export type ServicePackageItem = {
  id: number;
  service: number;
  service_name: string;
  service_base_price: string;
  quantity: number;
};

export type ServicePackage = {
  id: number;
  name: string;
  description: string;
  items: ServicePackageItem[];
  total_base_price: string;
};