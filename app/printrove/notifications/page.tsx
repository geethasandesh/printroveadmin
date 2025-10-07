"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Badge,
  Button,
  DataTable,
  ButtonGroup,
} from "@shopify/polaris";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function NotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const itemsPerPage = 20;

  const {
    notifications,
    total,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(currentPage, itemsPerPage);
  }, [currentPage]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge tone="critical">{severity}</Badge>;
      case "high":
        return <Badge tone="warning">{severity}</Badge>;
      case "medium":
        return <Badge tone="info">{severity}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type.includes("failure")) {
      return <Badge tone="warning">Sync Failure</Badge>;
    } else if (type.includes("exhausted")) {
      return <Badge tone="critical">Retry Exhausted</Badge>;
    } else if (type === "system_error") {
      return <Badge tone="critical">System Error</Badge>;
    }
    return <Badge>{type}</Badge>;
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const rows = filteredNotifications.map((notification, index) => [
    <div className="flex items-center gap-2">
      {!notification.isRead && (
        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
      <Text variant="bodyMd" as="span" fontWeight={notification.isRead ? "regular" : "bold"}>
        {notification.title}
      </Text>
    </div>,
    getTypeBadge(notification.type),
    getSeverityBadge(notification.severity),
    <Text variant="bodySm" as="span">
      {notification.message.length > 80
        ? `${notification.message.substring(0, 80)}...`
        : notification.message}
    </Text>,
    new Date(notification.createdAt).toLocaleString(),
    <ButtonGroup>
      {!notification.isRead && (
        <Button size="slim" onClick={() => markAsRead(notification._id)}>
          Mark Read
        </Button>
      )}
      <Button
        size="slim"
        tone="critical"
        onClick={() => deleteNotification(notification._id)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Text variant="headingLg" as="h3" fontWeight="bold">
            Notifications
          </Text>
          <Text variant="bodyMd" as="p" tone="subdued">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </Text>
        </div>
        <div className="flex gap-2">
          <ButtonGroup>
            <Button
              pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </Button>
          </ButtonGroup>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>Mark All as Read</Button>
          )}
        </div>
      </div>

      <Card>
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="headingMd" as="h4" tone="subdued">
              No notifications
            </Text>
          </div>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "text", "text", "text", "text"]}
            headings={["Title", "Type", "Severity", "Message", "Date", "Actions"]}
            rows={rows}
          />
        )}
      </Card>

      {isLoading && (
        <div className="mt-4 text-center">
          <Text variant="bodyMd" as="p">
            Loading...
          </Text>
        </div>
      )}

      {/* Pagination */}
      {total > itemsPerPage && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <Text variant="bodyMd" as="span">
            Page {currentPage} of {Math.ceil(total / itemsPerPage)}
          </Text>
          <Button
            disabled={currentPage >= Math.ceil(total / itemsPerPage)}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

