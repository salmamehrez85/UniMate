import { Bell } from "lucide-react";

export function Header({ activeView }) {
  const getTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "courses":
        return "My Courses";
      case "tasks":
        return "Tasks";
      case "summarizer":
        return "Summarizer";
      case "quizzes":
        return "Quizzes";
      case "performance":
        return "Performance";
      case "chat":
        return "AI Chat";
      case "schedule":
        return "Weekly Schedule";
      case "settings":
        return "Settings";
      default:
        return "UniMate";
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-10 md:ml-64 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-700 text-left tracking-tight">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-primary-600">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
