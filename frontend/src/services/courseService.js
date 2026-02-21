import { getAuthToken } from "./authService";

const API_BASE_URL = "http://localhost:3000/api";

// Get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Get all courses for logged in user
export const getCourses = async () => {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch courses");
  }

  return data;
};

// Get single course by ID
export const getSingleCourse = async (id) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch course");
  }

  return data;
};

// Create new course
export const createCourse = async (courseData) => {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create course");
  }

  return data;
};

// Update course
export const updateCourse = async (id, courseData) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update course");
  }

  return data;
};

// Delete course
export const deleteCourse = async (id) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete course");
  }

  return data;
};
