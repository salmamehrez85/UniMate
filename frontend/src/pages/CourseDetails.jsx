import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { OverviewTab } from "../components/CourseDetails/OverviewTab";
import { AssessmentsTab } from "../components/CourseDetails/AssessmentsTab";
import { TasksTab } from "../components/CourseDetails/TasksTab";
import { ProjectPhasesTab } from "../components/CourseDetails/ProjectPhasesTab";
import { SettingsTab } from "../components/CourseDetails/SettingsTab";
import { AIPracticeTab } from "../components/CourseDetails/AIPracticeTab";
import { LecturesTab } from "../components/CourseDetails/LecturesTab";
import { updateCourse, deleteCourse } from "../services/courseService";
import { useTranslation } from "react-i18next";

export function CourseDetails({
  courseId,
  course,
  onBack,
  onCourseUpdate,
  onCourseDelete,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [courseData, setCourseData] = useState(course);

  const tabs = [
    { id: "overview", label: t("courseDetails.tabs.overview") },
    { id: "assessments", label: t("courseDetails.tabs.assessments") },
    { id: "tasks", label: t("courseDetails.tabs.tasks") },
    { id: "phases", label: t("courseDetails.tabs.projectPhases") },
    { id: "lectures", label: t("courseDetails.tabs.lectures") },
    { id: "ai-practice", label: t("courseDetails.tabs.aiPractice") },
    { id: "settings", label: t("courseDetails.tabs.settings") },
  ];

  // Handler to update both local courseData and parent state + API
  const handleCourseUpdate = async (updatedCourse) => {
    try {
      setCourseData(updatedCourse);
      const response = await updateCourse(updatedCourse._id, updatedCourse);
      setCourseData(response.course);
      onCourseUpdate(response.course);
    } catch (error) {
      console.error("Error updating course:", error);
      // Revert to previous state on error
      setCourseData(courseData);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            course={courseData}
            onCourseUpdate={handleCourseUpdate}
          />
        );
      case "assessments":
        return (
          <AssessmentsTab
            course={courseData}
            onCourseUpdate={handleCourseUpdate}
          />
        );
      case "tasks":
        return (
          <TasksTab course={courseData} onCourseUpdate={handleCourseUpdate} />
        );
      case "phases":
        return (
          <ProjectPhasesTab
            course={courseData}
            onCourseUpdate={handleCourseUpdate}
          />
        );
      case "ai-practice":
        return <AIPracticeTab course={courseData} />;
      case "lectures":
        return (
          <LecturesTab
            course={courseData}
            onCourseUpdate={handleCourseUpdate}
          />
        );
      case "settings":
        return (
          <SettingsTab
            course={courseData}
            onCourseUpdate={handleCourseUpdate}
            onCourseDelete={onCourseDelete}
            onBack={onBack}
          />
        );
      default:
        return <OverviewTab course={courseData} />;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-full space-y-6 px-6 pb-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center mb-2">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all font-bold text-sm bg-white dark:bg-gray-800/80 px-3.5 py-2 rounded-xl shadow-xs border border-gray-100 dark:border-gray-800 cursor-pointer">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          {t("courseDetails.backToCourses")}
        </button>
      </div>

      {/* Course Hero Banner */}
      <div className="page-hero">
        {/* Blobs */}
        <div className="page-hero-blob page-hero-blob-1" />
        <div className="page-hero-blob page-hero-blob-2" />
        <div className="page-hero-blob page-hero-blob-3" />

        <div className="page-hero-content space-y-4">
          <div>
            <div className="page-hero-label">
              <span className="page-hero-label-dot" />
              {courseData.code}
            </div>
            <h1 className="page-hero-title text-2xl md:text-3.5xl font-extrabold leading-tight">
              {courseData.name || courseData.title}
            </h1>
            {courseData.instructor && (
              <p className="page-hero-subtitle mt-2 flex items-center gap-1.5 text-black/90">
                <span className="font-semibold text-black/70">{t("courses.card.instructor") || "Instructor"}:</span>
                {courseData.instructor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="glass-card p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-white/20 dark:border-white/5 shadow-xs overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-indigo-400 to-violet-500 text-white shadow-md shadow-indigo-200/50 dark:shadow-none"
                : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex flex-col flex-1">{renderTab()}</div>
    </div>
  );
}
