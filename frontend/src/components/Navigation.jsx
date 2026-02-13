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
} from "lucide-react";
import { Logo } from "./Logo";

export function Navigation({ activeView, setActiveView }) {
  const navSections = [
    {
      items: [
        { id: "dashboard", label: "Dashboard", Icon: LayoutGrid },
        { id: "courses", label: "Courses", Icon: BookOpen },
        { id: "tasks", label: "Tasks", Icon: CheckCircle },
        { id: "schedule", label: "Schedule", Icon: Calendar },
      ],
    },
    {
      title: "AI TOOLS",
      items: [
        { id: "chat", label: "AI Assistant", Icon: MessageSquare },
        { id: "summarizer", label: "Summarizer", Icon: FileText },
        { id: "quizzes", label: "Quiz", Icon: HelpCircle },
        { id: "email", label: "Email Professor", Icon: Mail },
      ],
    },
    {
      title: "INSIGHTS",
      items: [{ id: "performance", label: "Performance", Icon: TrendingUp }],
    },
    {
      items: [{ id: "settings", label: "Settings", Icon: Settings }],
    },
  ];

  // Flatten all items for mobile nav
  const allNavItems = navSections.flatMap((section) => section.items);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg">
        <div className="flex justify-around items-center h-16">
          {allNavItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                activeView === item.id
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-primary-600"
              }`}>
              <item.Icon className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-20 shadow-sm">
        <div className="p-2 border-b border-gray-100 flex flex-col items-center">
          <Logo size="lg" showText={true} />
          <p className="text-[10px] text-gray-500 font-medium tracking-wide text-center">
            Professional Learning Platform
          </p>
        </div>
        <nav className="px-3 py-4 space-y-6">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 tracking-wider uppercase">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                      activeView === item.id
                        ? "bg-primary-50 text-primary-700 shadow-sm border border-primary-100"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}>
                    <item.Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {activeView === item.id && (
                      <div className="w-1.5 h-1.5 bg-primary-600 rounded-full ml-auto"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50">
          <p className="text-xs text-gray-500 text-center">
            <span className="font-semibold">UniMate</span> • Academic AI
          </p>
        </div>
      </aside>
    </>
  );
}
