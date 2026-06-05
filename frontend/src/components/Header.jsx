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
  deadline:    { icon: AlertCircle, color: "text-amber-500",  bg: "bg-amber-50/80"   },
  quiz:        { icon: BookOpen,    color: "text-indigo-500", bg: "bg-indigo-50/80"  },
  performance: { icon: TrendingUp,  color: "text-violet-500", bg: "bg-violet-50/80"  },
  summary:     { icon: BookOpen,    color: "text-purple-500", bg: "bg-purple-50/80"  },
};

export function Header({ activeView, onLogout }) {
  const { t } = useTranslation();
  const [open, setOpen]           = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const panelRef = useRef(null);

  const { notifications, unreadCount, refresh, markRead, markAllAsRead, dismiss } =
    useNotifications();

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleOpen = (n) => {
    if (!n.read) markRead(n._id);
    setExpandedId((prev) => (prev === n._id ? null : n._id));
  };

  const getTitle = () => {
    const map = {
      dashboard:   t("header.dashboard"),
      courses:     t("header.myCourses"),
      tasks:       t("header.tasks"),
      summarizer:  t("header.summarizer"),
      quizzes:     t("header.quizzes"),
      performance: t("header.performance"),
      chat:        t("header.aiChat"),
      schedule:    t("header.schedule"),
      email:       t("header.emailProfessor"),
      settings:    t("header.settings"),
    };
    return map[activeView] ?? t("header.unimate");
  };

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99,102,241,0.1)",
        boxShadow: "0 1px 20px rgba(99,102,241,0.06)",
      }}
    >
      <div className="mx-auto px-3 md:px-6 py-3.5 md:py-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">

          {/* Gradient shimmer page title */}
          <h1
            className="text-lg md:text-2xl font-extrabold tracking-tight truncate"
            style={{
              background:
                "linear-gradient(135deg,#4f46e5 0%,#7c3aed 40%,#a855f7 70%,#3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {getTitle()}
          </h1>

          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            {/* Bell + notification panel */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 md:p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex-shrink-0"
                style={{
                  background: open
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                    : "transparent",
                  color: open ? "white" : "#6366f1",
                }}
              >
                <Bell className="w-4 md:w-5 h-4 md:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 flex items-center justify-center bg-red-500 rounded-full text-white text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-2 w-72 lg:w-80 rounded-2xl z-50 flex flex-col max-h-96 overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    boxShadow:
                      "0 20px 60px -10px rgba(99,102,241,0.25), 0 8px 20px -5px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Panel header */}
                  <div className="px-4 py-3 border-b border-indigo-50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-gray-800 text-sm">
                        {t("header.notifications")}
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors font-semibold"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification list */}
                  <div className="overflow-y-auto divide-y divide-gray-50/80 flex-1 min-h-0">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                        <Bell className="w-8 h-8 text-indigo-100" />
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const style = TYPE_STYLES[n.type] || TYPE_STYLES.deadline;
                        const Icon  = style.icon;
                        const isExpanded = expandedId === n._id;
                        return (
                          <div
                            key={n._id}
                            onClick={() => handleOpen(n)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-indigo-50/40 ${
                              n.read ? "bg-transparent" : style.bg
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 ${style.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-snug ${
                                  n.read
                                    ? "font-normal text-gray-500"
                                    : "font-semibold text-gray-800"
                                }`}
                              >
                                {n.title}
                              </p>
                              <p
                                className={`text-xs text-gray-500 mt-0.5 ${
                                  isExpanded ? "" : "line-clamp-2"
                                }`}
                              >
                                {n.message}
                              </p>
                              {!isExpanded && n.message && n.message.length > 100 && (
                                <p className="text-[10px] text-indigo-500 mt-0.5 font-medium">
                                  Tap to read more
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(n._id); }}
                              className="shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer transition-colors mt-0.5"
                            >
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

            <LanguageSwitcher className="text-xs hidden sm:flex" />

            <button
              onClick={onLogout}
              className="p-2 md:p-2.5 hover:bg-red-50 rounded-xl transition-all active:scale-95 text-red-500 cursor-pointer flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 md:w-5 h-4 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
