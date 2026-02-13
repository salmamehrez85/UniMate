import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Courses } from "./components/Courses";
import { Tasks } from "./components/Tasks";
import { Summarizer } from "./components/Summarizer";
import { Quizzes } from "./components/Quizzes";
import { Performance } from "./components/Performance";
import { AIChat } from "./components/AIChat";
import { Settings } from "./components/Settings";
import { WeeklySchedule } from "./components/WeeklySchedule";
import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import "./App.css";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "courses":
        return <Courses />;
      case "tasks":
        return <Tasks />;
      case "summarizer":
        return <Summarizer />;
      case "quizzes":
        return <Quizzes />;
      case "performance":
        return <Performance />;
      case "chat":
        return <AIChat />;
      case "schedule":
        return <WeeklySchedule />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} />
      <main className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6">{renderView()}</div>
      </main>
      <Navigation activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
