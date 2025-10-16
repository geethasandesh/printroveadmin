"use client";

import { useState, useEffect } from 'react';
import { Card, Text, Button, Badge } from '@shopify/polaris';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getApiBaseUrl } from "@/lib/apiUrl";

interface Notification {
  _id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  title: string;
  message: string;
  recipients: string[];
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const url = filter === 'unread'
        ? `${baseUrl}/api/notifications?recipient=admin&unreadOnly=true`
        : `${baseUrl}/api/notifications?recipient=admin`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'admin' })
        }
      );

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'admin' })
        }
      );

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const tones: Record<string, any> = {
      error: 'critical',
      warning: 'warning',
      success: 'success',
      info: 'info'
    };

    return <Badge tone={tones[type] || 'info'}>{type.toUpperCase()}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'config_change':
        return 'Config Change';
      case 'config_deactivation':
        return 'Config Deactivation';
      case 'product_update':
        return 'Product Update';
      default:
        return 'System';
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold">Notifications</h1>
          <p className="text-sm text-gray-600 mt-1">
            {total} total notifications • {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-3">Loading notifications...</p>
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="p-16 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread' 
                  ? "You're all caught up! Check back later for updates."
                  : 'Notifications will appear here when there are important updates.'}
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification._id}>
              <div className={`p-5 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTypeBadge(notification.type)}</span>
                      <Text variant="headingMd" as="h3">
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Category: {getCategoryLabel(notification.category)}</span>
                      <span>•</span>
                      <span>{format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      {notification.relatedEntity && (
                        <>
                          <span>•</span>
                          <span>Related: {notification.relatedEntity.name}</span>
                        </>
                      )}
                    </div>

                    {notification.actionUrl && notification.actionLabel && (
                      <div className="mt-4">
                        <button
                          onClick={() => router.push(notification.actionUrl!)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          {notification.actionLabel} →
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
