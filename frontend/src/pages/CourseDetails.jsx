import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { OverviewTab } from "../components/CourseDetails/OverviewTab";
import { AssessmentsTab } from "../components/CourseDetails/AssessmentsTab";
import { TasksTab } from "../components/CourseDetails/TasksTab";
import { ProjectPhasesTab } from "../components/CourseDetails/ProjectPhasesTab";
import { SettingsTab } from "../components/CourseDetails/SettingsTab";
import { AIPracticeTab } from "../components/CourseDetails/AIPracticeTab";
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
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
      {/* Header with Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition font-medium">
          <ChevronLeft className="w-5 h-5" />
          {t("courseDetails.backToCourses")}
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              {courseData.name || courseData.title}
            </h1>
            <p className="text-gray-600">
              {t("courseDetails.courseCode", { code: courseData.code })}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition whitespace-nowrap ${
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
      <div>{renderTab()}</div>
    </div>
  );
}
