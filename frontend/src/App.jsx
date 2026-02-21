import { useState, useEffect } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Courses } from "./pages/Courses";
import { Performance } from "./pages/Performance";
import { Quizzes } from "./pages/Quizzes";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Tasks } from "./components/Tasks";
import { AIChat } from "./components/AIChat";
import { Summarizer } from "./components/Summarizer";
import { Settings } from "./components/Settings";
import { WeeklySchedule } from "./components/WeeklySchedule";
import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import { getAuthToken, logout as logoutService } from "./services/authService";
import "./App.css";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState("login"); // 'login' or 'register'
  const [activeView, setActiveView] = useState("dashboard");

  // Check for existing auth token on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    // After registration, redirect to login instead of dashboard
    logoutService();
    setIsAuthenticated(false);
    setAuthView("login");
  };

  const handleLogout = () => {
    logoutService(); // Clear token and user data
    setIsAuthenticated(false);
    setActiveView("dashboard");
  };

  // Show authentication pages if not logged in
  if (!isAuthenticated) {
    if (authView === "login") {
      return (
        <Login
          onSwitchToRegister={() => setAuthView("register")}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    } else {
      return (
        <Register
          onSwitchToLogin={() => setAuthView("login")}
          onRegisterSuccess={handleRegisterSuccess}
        />
      );
    }
  }

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
        return <Settings onLogout={handleLogout} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} onLogout={handleLogout} />
      <main className="pb-20 md:pb-6 md:ml-64">
        <div className="max-w-7xl mx-auto px-4 py-6">{renderView()}</div>
      </main>
      <Navigation activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
