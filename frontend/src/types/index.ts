export type Role = "CLIENT" | "WORKER" | "ADMIN";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  role: Role;
}