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

const parseJsonResponse = async (response, fallbackMessage) => {
  const raw = await response.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || fallbackMessage);
  }

  return data;
};

export const getAvailableQuizzes = async (courseId) => {
  const response = await fetch(
    `${API_BASE_URL}/quizzes/available/${courseId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return parseJsonResponse(response, "Failed to fetch available quizzes");
};

export const generateQuiz = async ({
  courseId,
  numberOfQuestions,
  difficulty,
  questionType,
  sourceContext,
  useMock,
  language,
}) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      courseId,
      numberOfQuestions,
      difficulty,
      questionType,
      sourceContext,
      useMock,
      language,
    }),
  });

  return parseJsonResponse(response, "Failed to generate quiz");
};

export const submitQuiz = async ({
  quizId,
  userAnswers,
  submissionSource = "practice",
  completedAt,
}) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      quizId,
      userAnswers,
      submissionSource,
      completedAt,
    }),
  });

  return parseJsonResponse(response, "Failed to submit quiz");
};

export const getQuizResultsByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/quizzes/results/${courseId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJsonResponse(response, "Failed to fetch quiz results");
};
