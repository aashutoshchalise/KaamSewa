import { api } from "./axios";
import type { Service } from "../types";

export async function getServiceList(): Promise<Service[]> {
  const { data } = await api.get<Service[]>("/api/services/");
  return data;
}

export async function getService(id: number | string): Promise<Service> {
  const { data } = await api.get<Service>(`/api/services/${id}/`);
  return data;
}

export async function getServiceById(id: number) {
  const { data } = await api.get<Service>(`/api/services/${id}/`);
  return data;
}

export async function getPackageList() {
  const { data } = await api.get("/api/services/packages/");
  return data;
}

export async function getPackage(id: number) {
  const { data } = await api.get(`/api/services/packages/${id}/`);
  return data;
}