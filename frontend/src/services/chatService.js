import { getAuthToken } from "./authService";

const API_BASE_URL = "http://localhost:3000/api";

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const sendChatMessage = async (messages) => {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get AI response");
  }

  return data.reply;
};
