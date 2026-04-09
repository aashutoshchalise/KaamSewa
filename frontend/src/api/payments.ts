import { api } from "./axios";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "KHALTI";

export type Payment = {
  id: number;
  booking: number;
  client: number;
  worker: number;
  amount: string;
  commission_amount: string;
  worker_earning: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference?: string | null;
  khalti_pidx?: string | null;
  created_at: string;
};

export type InitiateKhaltiPaymentResponse = {
  payment_url: string;
  pidx: string;
};

export type VerifyKhaltiPaymentResponse = {
  detail: string;
  transaction_reference?: string;
};



export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type WithdrawalRequest = {
  id: number;
  worker: number;
  amount: string;
  status: WithdrawalStatus;
  created_at: string;
};

export type WorkerWalletSummary = {
  total_earned: string;
  available_balance: string;
  pending_withdrawals_total: string;
  pending_withdrawals_count: number;
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

export async function initiateKhaltiPayment(
  paymentId: number
): Promise<InitiateKhaltiPaymentResponse> {
  const { data } = await api.post<InitiateKhaltiPaymentResponse>(
    `/api/payments/${paymentId}/khalti/initiate/`
  );
  return data;
}

export async function verifyKhaltiPayment(
  paymentId: number
): Promise<VerifyKhaltiPaymentResponse> {
  const res = await api.post(`/api/payments/${paymentId}/khalti/verify/`);
  return res.data;
}

export async function getWorkerWalletSummary(): Promise<WorkerWalletSummary> {
  const { data } = await api.get<WorkerWalletSummary>(
    "/api/payments/wallet/summary/"
  );
  return data;
}

export async function createWithdrawal(
  amount: number
): Promise<{ detail: string }> {
  const { data } = await api.post<{ detail: string }>(
    "/api/payments/withdraw/",
    { amount }
  );
  return data;
}

export async function getMyWithdrawals(): Promise<WithdrawalRequest[]> {
  const { data } = await api.get<WithdrawalRequest[]>(
    "/api/payments/withdraw/my/"
  );
  return data;
}