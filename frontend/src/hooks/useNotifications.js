import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notificationService";

const POLL_INTERVAL = 60_000; // 60 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently fail — user may not be logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    // Refresh when tab regains focus
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const dismiss = useCallback(
    async (id) => {
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    },
    [notifications],
  );

  const clearAll = useCallback(async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch {}
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markRead,
    markAllAsRead,
    dismiss,
    clearAll,
  };
}
