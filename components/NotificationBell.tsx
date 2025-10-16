"use client";

import { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getApiBaseUrl } from "@/lib/apiUrl";

interface Notification {
  _id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: string;
  title: string;
  message: string;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(
        `${API_URL}/api/notifications?recipient=admin&limit=10`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        // If endpoint doesn't exist yet, silently fail
        console.log('Notifications endpoint not available yet');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      // Silently fail - notifications are optional
      console.log('Notifications feature not available');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'admin' })
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(
        `${API_URL}/api/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'admin' })
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.log('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative rounded-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Menu.Item key={notification._id}>
                  {({ active }) => (
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer ${
                        active ? 'bg-gray-50' : ''
                      } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 text-lg">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.actionLabel && (
                            <p className="mt-2 text-xs text-indigo-600 font-medium">
                              → {notification.actionLabel}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 text-center">
              <button
                onClick={() => router.push('/printrove/notifications')}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

