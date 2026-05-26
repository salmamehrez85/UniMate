import { useState, useEffect, useRef } from "react";
import {
  Bell,
  LogOut,
  X,
  AlertCircle,
  BookOpen,
  TrendingUp,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const TYPE_STYLES = {
  deadline: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
  quiz: { icon: BookOpen, color: "text-primary-600", bg: "bg-blue-50" },
  performance: { icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
  summary: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
};

export function Header({ activeView, onLogout }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const {
    notifications,
    unreadCount,
    refresh,
    markRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  // Refresh when panel is opened
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleOpen = (n) => {
    if (!n.read) markRead(n._id);
  };

  const getTitle = () => {
    switch (activeView) {
      case "dashboard":
        return t("header.dashboard");
      case "courses":
        return t("header.myCourses");
      case "tasks":
        return t("header.tasks");
      case "summarizer":
        return t("header.summarizer");
      case "quizzes":
        return t("header.quizzes");
      case "performance":
        return t("header.performance");
      case "chat":
        return t("header.aiChat");
      case "schedule":
        return t("header.schedule");
      case "email":
        return t("header.emailProfessor");
      case "settings":
        return t("header.settings");
      default:
        return t("header.unimate");
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-10 md:ms-64 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-700 text-left tracking-tight">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-4">
            {/* Bell with dropdown */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-primary-600 cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 flex items-center justify-center bg-red-500 rounded-full text-white text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">
                      {t("header.notifications")}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 cursor-pointer transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const style =
                          TYPE_STYLES[n.type] || TYPE_STYLES.deadline;
                        const Icon = style.icon;
                        return (
                          <div
                            key={n._id}
                            onClick={() => handleOpen(n)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                              n.read ? "bg-white" : style.bg
                            }`}>
                            <div className={`mt-0.5 shrink-0 ${style.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-snug ${n.read ? "font-normal text-gray-600" : "font-medium text-gray-800"}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismiss(n._id);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer transition-colors mt-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <LanguageSwitcher />

            <button
              onClick={onLogout}
              className="p-2.5 hover:bg-red-50 rounded-lg transition-colors text-red-600 cursor-pointer"
              title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
