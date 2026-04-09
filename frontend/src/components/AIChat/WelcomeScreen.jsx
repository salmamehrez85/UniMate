import {
  BookOpen,
  Lightbulb,
  FlaskConical,
  Calculator,
  FileText,
  HelpCircle,
} from "lucide-react";

const STATIC_PROMPTS = [
  {
    Icon: BookOpen,
    label: "Explain a concept",
    prompt:
      "Can you explain the concept of recursion in programming with a simple example?",
  },
  {
    Icon: Calculator,
    label: "Solve a problem",
    prompt:
      "Help me solve this step by step: Find the derivative of f(x) = 3x² + 5x − 7",
  },
  {
    Icon: Lightbulb,
    label: "Study tips",
    prompt:
      "What are the most effective study techniques for retaining information long-term?",
  },
  {
    Icon: FlaskConical,
    label: "Exam prep",
    prompt:
      "I have an exam on thermodynamics tomorrow. Can you give me a quick overview of the key concepts?",
  },
];

const COURSE_ICONS = [
  BookOpen,
  FileText,
  HelpCircle,
  FlaskConical,
  Calculator,
  Lightbulb,
];

const PROMPT_TEMPLATES = [
  (name) => ({
    label: `Explain ${name}`,
    prompt: `I'm studying ${name}. Can you explain one of the core concepts in this course in a clear and simple way?`,
  }),
  (name) => ({
    label: `${name} exam prep`,
    prompt: `I have an upcoming exam in ${name}. What are the most important topics I should focus on?`,
  }),
  (name) => ({
    label: `${name} problem help`,
    prompt: `I'm stuck on a problem in ${name}. Can you walk me through how to approach it step by step?`,
  }),
  (name) => ({
    label: `Summarize ${name}`,
    prompt: `Can you give me a concise summary of the key topics covered in ${name}?`,
  }),
];

function buildCoursePrompts(courses) {
  // Pick up to 4 active courses and assign a template + icon to each
  return courses.slice(0, 4).map((course, i) => {
    const name = course.name || course.code || "this course";
    const template = PROMPT_TEMPLATES[i % PROMPT_TEMPLATES.length](name);
    return {
      Icon: COURSE_ICONS[i % COURSE_ICONS.length],
      label: template.label,
      prompt: template.prompt,
    };
  });
}

export function WelcomeScreen({ onSelectPrompt, courses = [] }) {
  const prompts =
    courses.length > 0 ? buildCoursePrompts(courses) : STATIC_PROMPTS;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mb-5 shadow-sm border border-primary-100">
        <BookOpen className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-primary-900 mb-2">
        How can I help you study today?
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-8">
        {courses.length > 0
          ? "Here are some suggestions based on your enrolled courses."
          : "Ask me to explain concepts, solve problems, summarize topics, or help you prepare for exams."}
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
