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

// Calculate Current GPA from completed courses
export const calculateCurrentGPA = async () => {
  try {
    const data = await getCourses();
    const courses = data.courses || [];

    // Filter only completed courses (courses with isOldCourse = true)
    const completedCourses = courses.filter(
      (course) => course.isOldCourse === true,
    );

    if (completedCourses.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        completedCourses: 0,
      };
    }

    let totalWeightedGrade = 0;
    let totalCredits = 0;

    completedCourses.forEach((course) => {
      // Get the final grade from assessments
      const finalAssessment = (course.assessments || []).find(
        (assessment) => assessment.type === "final",
      );

      if (finalAssessment) {
        const credits = parseFloat(course.credits) || 3; // Default to 3 if not specified
        const finalGrade =
          (finalAssessment.score / finalAssessment.maxScore) * 100;

        // Convert percentage to GPA scale (assuming 4.0 scale)
        // 90-100 = 4.0, 85-89 = 3.7, 80-84 = 3.3, etc.
        let gradePoints;
        if (finalGrade >= 90) gradePoints = 4.0;
        else if (finalGrade >= 85) gradePoints = 3.7;
        else if (finalGrade >= 80) gradePoints = 3.3;
        else if (finalGrade >= 75) gradePoints = 3.0;
        else if (finalGrade >= 70) gradePoints = 2.7;
        else if (finalGrade >= 65) gradePoints = 2.3;
        else if (finalGrade >= 60) gradePoints = 2.0;
        else gradePoints = 0.0;

        totalWeightedGrade += gradePoints * credits;
        totalCredits += credits;
      }
    });

    const gpa = totalCredits > 0 ? totalWeightedGrade / totalCredits : 0;

    return {
      gpa: Math.round(gpa * 100) / 100, // Round to 2 decimal places
      totalCredits: Math.round(totalCredits),
      completedCourses: completedCourses.length,
    };
  } catch (error) {
    console.error("Error calculating GPA:", error);
    return {
      gpa: 0,
      totalCredits: 0,
      completedCourses: 0,
    };
  }
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
