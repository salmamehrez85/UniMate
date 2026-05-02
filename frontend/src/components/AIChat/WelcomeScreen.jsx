import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  Calculator,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const COURSE_ICONS = [
  BookOpen,
  FileText,
  HelpCircle,
  FlaskConical,
  Calculator,
  Lightbulb,
];

export function WelcomeScreen({ onSelectPrompt, courses = [] }) {
  const { t } = useTranslation();

  const STATIC_PROMPTS = [
    { Icon: BookOpen, label: t("aiChat.welcome.explainConcept"), prompt: "Can you explain the concept of recursion in programming with a simple example?" },
    { Icon: Calculator, label: t("aiChat.welcome.solveProblem"), prompt: "Help me solve this step by step: Find the derivative of f(x) = 3x² + 5x − 7" },
    { Icon: Lightbulb, label: t("aiChat.welcome.studyTips"), prompt: "What are the most effective study techniques for retaining information long-term?" },
    { Icon: FlaskConical, label: t("aiChat.welcome.examPrep"), prompt: "I have an exam on thermodynamics tomorrow. Can you give me a quick overview of the key concepts?" },
  ];

  const PROMPT_TEMPLATES = [
    (name) => ({ label: t("aiChat.welcome.explainCourse", { name }), prompt: `I'm studying ${name}. Can you explain one of the core concepts in this course in a clear and simple way?` }),
    (name) => ({ label: t("aiChat.welcome.examPrepCourse", { name }), prompt: `I have an upcoming exam in ${name}. What are the most important topics I should focus on?` }),
    (name) => ({ label: t("aiChat.welcome.problemHelp", { name }), prompt: `I'm stuck on a problem in ${name}. Can you walk me through how to approach it step by step?` }),
    (name) => ({ label: t("aiChat.welcome.summarizeCourse", { name }), prompt: `Can you give me a concise summary of the key topics covered in ${name}?` }),
  ];

  function buildCoursePrompts(courseList) {
    return courseList.slice(0, 4).map((course, i) => {
      const name = course.name || course.code || "this course";
      const template = PROMPT_TEMPLATES[i % PROMPT_TEMPLATES.length](name);
      return { Icon: COURSE_ICONS[i % COURSE_ICONS.length], label: template.label, prompt: template.prompt };
    });
  }

  const prompts = courses.length > 0 ? buildCoursePrompts(courses) : STATIC_PROMPTS;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mb-5 shadow-sm border border-primary-100">
        <BookOpen className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-primary-900 mb-2">
        {t("aiChat.welcome.title")}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-8">
        {courses.length > 0
          ? t("aiChat.welcome.courseHint")
          : t("aiChat.welcome.generalHint")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {prompts.map(({ Icon: PromptIcon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onSelectPrompt(prompt)}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 text-left hover:border-primary-200 hover:bg-primary-50 transition-all shadow-sm group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
              <PromptIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
