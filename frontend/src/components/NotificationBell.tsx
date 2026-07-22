'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, Clock } from 'lucide-react';
import api from '../lib/api';
import { getAccessToken } from '../lib/auth';

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    // Only fetch if user is logged in
    const token = getAccessToken();
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      const { data } = await api.get('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch {
      // Silent fail if unauthenticated or network error
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        (Array.isArray(prev) ? prev : []).map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Silent fail
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-700 dark:text-slate-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card-pro border border-white/20 shadow-2xl z-50 overflow-hidden animate-fadeIn text-xs">
          <div className="p-4 border-b border-slate-200/20 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              <h3 className="font-extrabold text-sm">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-200/10">
            {safeNotifications.length === 0 ? (
              <div className="p-6 text-center opacity-60 font-medium">
                No notifications right now.
              </div>
            ) : (
              safeNotifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markAsRead(item.id)}
                  className={`p-3.5 flex gap-3 items-start transition cursor-pointer hover:bg-white/5 ${
                    !item.isRead ? 'bg-teal-500/5' : 'opacity-70'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.type === 'EMERGENCY' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : item.type === 'REMINDER' ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-teal-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`leading-snug ${!item.isRead ? 'font-bold' : 'font-medium'}`}>
                      {item.message}
                    </p>
                    <span className="text-[9px] opacity-50 block">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
