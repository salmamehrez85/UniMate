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
        return <OverviewTab course={courseData} />;
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
    <div className="flex flex-col flex-1 min-h-full space-y-4 md:space-y-6 px-3 md:px-6 pb-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 md:gap-2 text-primary-600 hover:text-primary-700 transition font-medium text-sm md:text-base">
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          {t("courseDetails.backToCourses")}
        </button>
      </div>

      <div className="bg-white rounded-xl p-3 md:p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-900 mb-1 md:mb-2">
              {courseData.name || courseData.title}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {t("courseDetails.courseCode", { code: courseData.code })}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-1 md:gap-2 border-b border-gray-200 -mx-3 md:-mx-6 px-3 md:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 md:px-4 py-2 md:py-3 font-medium transition text-sm md:text-base whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600 -mb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col flex-1">{renderTab()}</div>
    </div>
  );
}
