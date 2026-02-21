import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { OverviewTab } from "../components/CourseDetails/OverviewTab";
import { AssessmentsTab } from "../components/CourseDetails/AssessmentsTab";
import { TasksTab } from "../components/CourseDetails/TasksTab";
import { ProjectPhasesTab } from "../components/CourseDetails/ProjectPhasesTab";
import { SettingsTab } from "../components/CourseDetails/SettingsTab";

export function CourseDetails({
  courseId,
  course,
  onBack,
  onCourseUpdate,
  onCourseDelete,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [courseData, setCourseData] = useState(course);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "assessments", label: "Assessments" },
    { id: "tasks", label: "Tasks" },
    { id: "phases", label: "Project Phases" },
    { id: "settings", label: "Settings" },
  ];

  // Handler to update both local courseData and parent state
  const handleCourseUpdate = (updatedCourse) => {
    setCourseData(updatedCourse);
    onCourseUpdate(updatedCourse);
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
          Back to Courses
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-900 mb-2">
              {courseData.name}
            </h1>
            <p className="text-gray-600">Course Code: {courseData.code}</p>
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
