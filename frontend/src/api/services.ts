import { api } from "./axios";
import type { Service } from "../types";

export async function getServiceList(): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/api/services");
  return data;
}

export async function getService(id: number | string): Promise<Service> {
  const { data } = await api.get<Service>(`/api/services/${id}`);
  return data;
}