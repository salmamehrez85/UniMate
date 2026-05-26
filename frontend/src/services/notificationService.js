import { getAuthToken } from "./authService";

const API_BASE_URL = "http://localhost:3000/api";

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Fetch all notifications (unread first)
export const getNotifications = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to fetch notifications");
  return data; // { unreadCount, notifications }
};

// Mark one notification as read
export const markNotificationRead = async (id) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to update notification");
  return data;
};

// Mark all as read
export const markAllRead = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to update notifications");
  return data;
};

// Delete one notification
export const deleteNotification = async (id) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to delete notification");
  return data;
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to clear notifications");
  return data;
};

// Get notification preferences
export const getNotificationPrefsFromServer = async () => {
  const response = await fetch(`${API_BASE_URL}/notifications/prefs`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to fetch preferences");
  return data.prefs;
};

// Update notification preferences
export const updateNotificationPrefs = async (prefs) => {
  const response = await fetch(`${API_BASE_URL}/notifications/prefs`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(prefs),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.message || "Failed to update preferences");
  return data.prefs;
};
