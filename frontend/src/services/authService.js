const API_BASE_URL = "http://localhost:3000/api";

// Register new user
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Store auth token
export const setAuthToken = (token) => {
  localStorage.setItem("token", token);
  localStorage.setItem("authToken", token);
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

// Remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
};

// Store user data
export const setUserData = (user) => {
  localStorage.setItem("userData", JSON.stringify(user));
};

// Get user data
export const getUserData = () => {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
};

// Remove user data
export const removeUserData = () => {
  localStorage.removeItem("userData");
};

// Logout (clear all auth data)
export const logout = () => {
  removeAuthToken();
  removeUserData();
};

// Request password reset email
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to send reset email");
  return data;
};

// Reset password with token
export const resetPassword = async (token, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to reset password");
  return data;
};
