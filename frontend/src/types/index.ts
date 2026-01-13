export type Role = "CLIENT" | "WORKER" | "ADMIN";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: Role;
}

export type PricingUnit = "hour" | "fixed" | string;

export type Service = {
  id: number;
  name: string;
  base_price: number;
  description?: string;
  pricing_unit?: "hour" | "fixed" | string;
  is_active?: boolean;
  created_at?: string;
};

export type Booking = {
  id: number;
  type?: "service" | "package" | string;
  status: string;
  scheduled_at?: string;
  address?: string;
  notes?: string;
  quote_amount?: number;

  // service booking
  service?: Service;
};