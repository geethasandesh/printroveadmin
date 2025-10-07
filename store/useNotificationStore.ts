import { create } from "zustand";
import apiClient from "@/apiClient";

interface Notification {
  _id: string;
  type: "sync_failure" | "sync_retry_exhausted" | "system_error" | "warning" | "info";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  relatedEntity?: {
    type: string;
    id: string;
  };
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,

  fetchNotifications: async (page = 1, limit = 20) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get<{
        success: boolean;
        notifications: Notification[];
        total: number;
        unreadCount: number;
      }>("/admin-notifications", {
        params: { page, limit },
      });

      set({
        notifications: response.data.notifications,
        total: response.data.total,
        unreadCount: response.data.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        count: number;
      }>("/admin-notifications/unread-count");

      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.patch(`/admin-notifications/${id}/read`);

      // Update local state
      const notifications = get().notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );
      const unreadCount = Math.max(0, get().unreadCount - 1);

      set({ notifications, unreadCount });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post("/admin-notifications/mark-all-read");

      // Update local state
      const notifications = get().notifications.map((n) => ({
        ...n,
        isRead: true,
      }));

      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiClient.delete(`/admin-notifications/${id}`);

      // Update local state
      const notifications = get().notifications.filter((n) => n._id !== id);
      set({ notifications });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },
}));

