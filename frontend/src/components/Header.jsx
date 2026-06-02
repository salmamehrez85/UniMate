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
  const [expandedId, setExpandedId] = useState(null);
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
    setExpandedId((prev) => (prev === n._id ? null : n._id));
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
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
      <div className="mx-auto px-3 md:px-6 py-3 md:py-5">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <h1 className="text-lg md:text-2xl font-bold text-primary-700 text-left tracking-tight truncate">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
            {/* Bell with dropdown */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 md:p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-primary-600 cursor-pointer flex-shrink-0">
                <Bell className="w-4 md:w-5 h-4 md:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 flex items-center justify-center bg-red-500 rounded-full text-white text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden max-h-80">
                  <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-xs md:text-sm">
                      {t("header.notifications")}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-[10px] md:text-xs text-primary-600 hover:text-primary-700 cursor-pointer transition-colors">
                        <CheckCheck className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-3 md:px-4 py-6 md:py-8 text-center text-xs md:text-sm text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const style =
                          TYPE_STYLES[n.type] || TYPE_STYLES.deadline;
                        const Icon = style.icon;
                        const isExpanded = expandedId === n._id;
                        return (
                          <div
                            key={n._id}
                            onClick={() => handleOpen(n)}
                            className={`flex items-start gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 cursor-pointer transition-colors ${
                              n.read ? "bg-white" : style.bg
                            }`}>
                            <div className={`mt-0.5 shrink-0 ${style.color}`}>
                              <Icon className="w-3.5 md:w-4 h-3.5 md:h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs md:text-sm leading-snug ${n.read ? "font-normal text-gray-600" : "font-medium text-gray-800"}`}>
                                {n.title}
                              </p>
                              <p
                                className={`text-[10px] md:text-xs text-gray-500 mt-0.5 ${isExpanded ? "" : "line-clamp-2"}`}>
                                {n.message}
                              </p>
                              {!isExpanded &&
                                n.message &&
                                n.message.length > 100 && (
                                  <p className="text-[9px] md:text-[10px] text-primary-500 mt-0.5 font-medium">
                                    Tap to read more
                                  </p>
                                )}
                              <p className="text-[9px] md:text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismiss(n._id);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer transition-colors mt-0.5">
                              <X className="w-3 md:w-3.5 h-3 md:h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <LanguageSwitcher className="text-xs hidden sm:flex" />

            <button
              onClick={onLogout}
              className="p-2 md:p-2.5 hover:bg-red-50 rounded-lg transition-colors text-red-600 cursor-pointer flex-shrink-0"
              title="Logout">
              <LogOut className="w-4 md:w-5 h-4 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
