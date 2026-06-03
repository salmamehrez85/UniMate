import { API_BASE_URL } from "../config/api";
import { getAuthToken } from "./authService";

export const formalizeEmailWithAI = async (emailData) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/email/formalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to formalize email");
    }

    const data = await response.json();
    return data.formalizedEmail;
  } catch (error) {
    console.error("Email formalization error:", error);
    throw error;
  }
};
