import { useEffect, useState } from "react";
import { AvailableQuizzes } from "../components/Quizzes/AvailableQuizzes";
import { GenerateQuizForm } from "../components/Quizzes/GenerateQuizForm";
import { QuizSessionModal } from "../components/Quizzes/QuizSessionModal";
import { RecentResults } from "../components/Quizzes/RecentResults";
import { getCourses } from "../services/courseService";
import {
  generateQuiz,
  getAvailableQuizzes,
  submitQuiz,
} from "../services/quizService";

const RECENT_RESULTS_STORAGE_KEY = "quizRecentResults";

const loadStoredRecentResults = () => {
  const rawValue = localStorage.getItem(RECENT_RESULTS_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const formatRecentResult = (quiz, course, submissionResponse) => ({
  id: submissionResponse.quizResult._id,
  title: quiz.title,
  course: course ? `${course.code} - ${course.name}` : "Unknown course",
  date: new Date(submissionResponse.quizResult.completedAt).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ),
  score: submissionResponse.quizResult.score,
  weakAreas: submissionResponse.weakAreas,
});

export function Quizzes() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [targetTopics, setTargetTopics] = useState([]);
  const [recentResults, setRecentResults] = useState(loadStoredRecentResults);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const activeCourses = courses.filter((course) => course.isOldCourse !== true);

  const selectedCourse =
    activeCourses.find((course) => course._id === selectedCourseId) || null;

  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      setPageError("");

      try {
        const response = await getCourses();
        const fetchedCourses = (response.courses || []).filter(
          (course) => course.isOldCourse !== true,
        );
        setCourses(fetchedCourses);

        if (fetchedCourses.length > 0) {
          setSelectedCourseId(
            (currentCourseId) => currentCourseId || fetchedCourses[0]._id,
          );
        }
      } catch (error) {
        setPageError(error.message || "Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      RECENT_RESULTS_STORAGE_KEY,
      JSON.stringify(recentResults),
    );
  }, [recentResults]);

  useEffect(() => {
    if (!selectedCourseId) {
      setQuizzes([]);
      setTargetTopics([]);
      return;
    }

    const loadAvailableQuizzes = async () => {
      setLoadingQuizzes(true);
      setPageError("");

      try {
        const response = await getAvailableQuizzes(selectedCourseId);
        setQuizzes(response.quizzes || []);
        setTargetTopics(response.targetTopics || []);
      } catch (error) {
        setPageError(error.message || "Failed to load quizzes");
      } finally {
        setLoadingQuizzes(false);
      }
    };

    loadAvailableQuizzes();
  }, [selectedCourseId]);

  const handleGenerateQuiz = async (formValues) => {
    setIsGenerating(true);
    setGenerateError("");

    try {
      const response = await generateQuiz(formValues);
      const generatedQuiz = response.quiz;
      setSelectedCourseId(formValues.courseId);
      setQuizzes((currentQuizzes) => [generatedQuiz, ...currentQuizzes]);
      setActiveQuiz(generatedQuiz);
    } catch (error) {
      setGenerateError(error.message || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitQuiz = async (quizId, userAnswers) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await submitQuiz({
        quizId,
        userAnswers,
        submissionSource: "practice",
        completedAt: new Date().toISOString(),
      });

      const completedQuiz = quizzes.find((quiz) => quiz._id === quizId);
      const recentResult = formatRecentResult(
        completedQuiz,
        selectedCourse,
        response,
      );

      setRecentResults((currentResults) =>
        [recentResult, ...currentResults].slice(0, 10),
      );
      setActiveQuiz(null);

      const refreshedQuizzes = await getAvailableQuizzes(selectedCourseId);
      setQuizzes(refreshedQuizzes.quizzes || []);
      setTargetTopics(refreshedQuizzes.targetTopics || []);
    } catch (error) {
      setSubmitError(error.message || "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
      <AvailableQuizzes
        courses={activeCourses}
        quizzes={quizzes}
        loading={loadingCourses || loadingQuizzes}
        error={pageError}
        selectedCourseId={selectedCourseId}
        targetTopics={targetTopics}
        onSelectCourse={setSelectedCourseId}
        onStartQuiz={setActiveQuiz}
      />
      <RecentResults results={recentResults} />
      <GenerateQuizForm
        courses={activeCourses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
        onGenerateQuiz={handleGenerateQuiz}
        isGenerating={isGenerating}
        error={generateError}
      />
      <QuizSessionModal
        quiz={activeQuiz}
        course={selectedCourse}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={() => {
          setActiveQuiz(null);
          setSubmitError("");
        }}
        onSubmit={handleSubmitQuiz}
      />
    </div>
  );
}
