import { api } from "./axios";

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export async function getMyNotifications(): Promise<NotificationItem[]> {
  const res = await api.get("/api/notifications/my/");
  return res.data;
}

export async function markNotificationRead(notificationId: number) {
  const res = await api.post(`/api/notifications/${notificationId}/read/`);
  return res.data;
}