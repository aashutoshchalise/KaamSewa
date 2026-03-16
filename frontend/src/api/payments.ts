import { api } from "./axios";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export type Payment = {
  id: number;
  booking: number;
  client: number;
  worker: number;
  amount: string;
  commission_amount: string;
  worker_earning: string;
  status: PaymentStatus;
  transaction_reference?: string | null;
  created_at: string;
};

export async function getPaymentByBooking(
  bookingId: number
): Promise<Payment> {
  const { data } = await api.get<Payment>(
    `/api/payments/booking/${bookingId}/`
  );
  return data;
}

export async function confirmPayment(
  paymentId: number
): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>(
    `/api/payments/${paymentId}/confirm/`
  );
  return data;
}