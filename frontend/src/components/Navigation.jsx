import {
  LayoutGrid,
  BookOpen,
  CheckCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Settings,
  Mail,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { useTranslation } from "react-i18next";

export function Navigation({ activeView, setActiveView }) {
  const { t } = useTranslation();

  const navSections = [
    {
      items: [
        { id: "dashboard", label: t("nav.dashboard"), Icon: LayoutGrid },
        { id: "courses",   label: t("nav.courses"),   Icon: BookOpen   },
        { id: "tasks",     label: t("nav.tasks"),     Icon: CheckCircle },
        { id: "schedule",  label: t("nav.schedule"),  Icon: Calendar   },
      ],
    },
    {
      title: t("nav.aiTools"),
      items: [
        { id: "chat",      label: t("nav.aiAssistant"),    Icon: MessageSquare },
        { id: "summarizer",label: t("nav.summarizer"),     Icon: FileText      },
        { id: "quizzes",   label: t("nav.quiz"),           Icon: HelpCircle    },
        { id: "email",     label: t("nav.emailProfessor"), Icon: Mail          },
      ],
    },
    {
      title: t("nav.insights"),
      items: [
        { id: "performance", label: t("nav.performance"), Icon: TrendingUp },
      ],
    },
    {
      items: [{ id: "settings", label: t("nav.settings"), Icon: Settings }],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  return (
    <>
      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#3b82f6 100%)",
          borderTop: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center h-14 overflow-x-auto scrollbar-hide">
          {allNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center px-2 h-full min-w-max transition-all ${
                activeView === item.id
                  ? "text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <item.Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 font-medium whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside
        className="sidebar-premium hidden md:block fixed start-0 top-0 bottom-0 w-64 z-20 shadow-2xl"
      >
        {/* Logo */}
        <div className="p-2 border-b border-gray-200/50 dark:border-gray-800 flex flex-col items-center">
          <Logo size="lg" showText={true} />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-widest uppercase text-center mt-3 pb-3">
            {t("nav.tagline")}
          </p>
        </div>

        <nav className="px-3 py-5 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.title && (
                <h3 className="nav-section-label px-4 mb-2 text-[10px] font-bold tracking-widest uppercase">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-semibold text-sm border cursor-pointer ${
                      activeView === item.id
                        ? "nav-item-active"
                        : "nav-item-inactive"
                    }`}
                  >
                    <item.Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-none">{item.label}</span>
                    {activeView === item.id && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full ml-auto opacity-80" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              <span className="font-bold text-gray-600 dark:text-gray-400">UniMate</span>{" "}
              {t("nav.footer").split("UniMate • ")[1] || t("nav.footer")}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
