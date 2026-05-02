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

export const sendChatMessage = async (
  messages,
  sessionId = null,
  language = "en",
) => {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ messages, sessionId, language }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get AI response");
  }

  return { reply: data.reply, sessionId: data.sessionId, title: data.title };
};

export const getChatSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch chat sessions");
  }

  return data.sessions;
};

export const loadChatSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load chat session");
  }

  return data.session;
};

export const renameChatSession = async (sessionId, title) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to rename chat session");
  }

  return data.session;
};

export const deleteChatSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete chat session");
  }

  return data;
};
