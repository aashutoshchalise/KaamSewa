import { api } from "./axios";

export type SupportMessage = {
  id: number;
  client: number;
  client_username?: string;
  subject: string;
  message: string;
  admin_reply?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createSupportMessage(payload: {
  subject: string;
  message: string;
}) {
  const res = await api.post("/api/support/create/", payload);
  return res.data;
}

export async function getMySupportMessages(): Promise<SupportMessage[]> {
  const res = await api.get("/api/support/my/");
  return res.data;
}