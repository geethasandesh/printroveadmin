"use client";

import React, { useEffect, useState } from "react";
import { Icon, Popover, Badge, ActionList, Text, Button } from "@shopify/polaris";
import { NotificationIcon } from "@shopify/polaris-icons";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const router = useRouter();
  const [popoverActive, setPopoverActive] = useState(false);
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    // Add a small delay to ensure backend is ready
    const fetchWithRetry = async () => {
      try {
        await fetchUnreadCount();
      } catch (error) {
        console.log("Failed to fetch notifications, will retry...", error);
      }
    };

    // Initial fetch with small delay
    setTimeout(fetchWithRetry, 1000);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchWithRetry();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (popoverActive) {
      fetchNotifications(1, 10);
    }
  }, [popoverActive]);

  const togglePopover = () => setPopoverActive((active) => !active);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setPopoverActive(false);

    // Navigate to related entity if available
    if (notification.relatedEntity?.type === "vendor") {
      // Could navigate to sync queue page or vendor page
      router.push("/printrove/purchase/vendor");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "critical";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "new";
    }
  };

  const activator = (
    <button
      onClick={togglePopover}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Icon source={NotificationIcon} tone="base" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={togglePopover}
      autofocusTarget="first-node"
      preferredAlignment="right"
    >
      <div className="w-96 max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <Text variant="headingMd" as="h3">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Button size="slim" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Text tone="subdued" as="p">
              No notifications
            </Text>
          </div>
        ) : (
          <ActionList
            items={notifications.slice(0, 10).map((notification) => ({
              content: (
                <div className="py-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Text variant="bodyMd" as="p" fontWeight={notification.isRead ? "regular" : "bold"}>
                      {notification.title}
                    </Text>
                    <Badge tone={getSeverityColor(notification.severity)} size="small">
                      {notification.severity}
                    </Badge>
                  </div>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {notification.message.length > 100
                      ? `${notification.message.substring(0, 100)}...`
                      : notification.message}
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {new Date(notification.createdAt).toLocaleString()}
                  </Text>
                </div>
              ),
              onAction: () => handleNotificationClick(notification),
            }))}
          />
        )}

        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <Button
              variant="plain"
              onClick={() => {
                setPopoverActive(false);
                router.push("/printrove/notifications");
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </div>
    </Popover>
  );
}

