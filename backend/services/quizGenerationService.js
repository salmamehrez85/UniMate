const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../model/Course");
const Quiz = require("../model/Quiz");

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_QUIZ_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter(Boolean);

const QUIZ_GENERATION_SYSTEM_PROMPT = `You are UniMate's expert professor-grade quiz generator.

Your job is to create academically sound practice quizzes from retrieved course material.

Non-negotiable rules:
1. Return valid JSON only. No markdown, no code fences, no commentary, no explanation.
2. The top-level JSON object must contain exactly these keys: title, description, questions.
3. questions must be an array of question objects that match this structure exactly:
   {
     "questionId": string,
     "prompt": string,
     "type": "mcq" | "true_false" | "short_answer" | "multiple_select",
     "difficulty": "easy" | "medium" | "hard",
     "options": [{ "key": string, "text": string }],
     "correctAnswer": string | boolean | string[],
     "explanation": string,
     "points": number,
     "estimatedSeconds": number,
     "subTopicTags": string[],
     "sourceChunks": string[]
   }
4. Every question must include 1 to 3 highly specific subTopicTags.
5. Never use broad tags like "math", "programming", "database", or "algorithms".
6. Use specific micro-tags such as "bst_deletion", "inner_join_filtering", "matrix_multiplication", "chain_rule", or "avl_rotations".
7. questionId must be short, unique, and slug-like.
8. For mcq and multiple_select questions, options must contain 4 answer choices.
9. For true_false questions, options must be an empty array and correctAnswer must be a boolean.
10. For short_answer questions, options must be an empty array and correctAnswer must be a concise canonical answer string.
11. explanation must be short, accurate, and educational.
12. points must be a positive integer.
13. estimatedSeconds must be realistic for the question difficulty.
14. sourceChunks must point to the most relevant retrieved material fragments.
15. Do not invent content unrelated to the provided course context.
16. Maintain academic correctness and avoid ambiguous or trick questions unless explicitly requested.
17. If the requested question type is "all", produce a sensible mix of types.
18. Ensure the JSON is parseable by a production backend without manual cleanup.`;

const DEFAULT_GENERATION_CONFIG = {
  timeoutMs: 30000,
  maxQuestions: 25,
  minQuestions: 1,
};

const QUESTION_TYPE_MAP = {
  all: "all",
  mcq: "mcq",
  choose: "multiple_select",
  complete: "short_answer",
  truefalse: "true_false",
  true_false: "true_false",
  multiple_select: "multiple_select",
  short_answer: "short_answer",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const withTimeout = (promise, timeoutMs, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);

const normalizeQuestionType = (questionType) =>
  QUESTION_TYPE_MAP[
    String(questionType || "all")
      .trim()
      .toLowerCase()
  ] || "all";

const normalizeGeneratedQuestionType = (questionType) => {
  const normalizedType = normalizeQuestionType(questionType);

  return normalizedType === "all" ? "mcq" : normalizedType;
};

const normalizeDifficulty = (difficulty) => {
  const normalizedDifficulty = String(difficulty || "medium")
    .trim()
    .toLowerCase();

  return ["easy", "medium", "hard"].includes(normalizedDifficulty)
    ? normalizedDifficulty
    : "medium";
};

const normalizeQuestionCount = (count, config = DEFAULT_GENERATION_CONFIG) => {
  const parsedCount = Number.parseInt(count, 10);

  if (Number.isNaN(parsedCount)) {
    return 10;
  }

  return clamp(parsedCount, config.minQuestions, config.maxQuestions);
};

const extractJsonObject = (responseText) => {
  const trimmed = String(responseText || "").trim();

  if (!trimmed) {
    throw new Error("The AI returned an empty response");
  }

  const withoutFences = trimmed.replace(/```json|```/gi, "").trim();
  const firstBraceIndex = withoutFences.indexOf("{");
  const lastBraceIndex = withoutFences.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1) {
    throw new Error("The AI response did not contain valid JSON");
  }

  return withoutFences.slice(firstBraceIndex, lastBraceIndex + 1);
};

const normalizeTag = (tag) =>
  String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const MOCK_TAG_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "like",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const MOCK_TAG_FALLBACKS = {
  default: ["core_concepts", "applied_reasoning", "problem_solving"],
  english: ["grammar", "vocabulary", "reading_comprehension", "writing_skills"],
  math: ["algebra", "functions", "equations", "problem_solving"],
  programming: ["variables", "control_flow", "functions", "debugging"],
  "data structure": ["arrays", "linked_lists", "stacks", "trees", "sorting"],
  "computer science": [
    "data_structures",
    "algorithms",
    "networking",
    "operating_systems",
  ],
  networking: ["network_layers", "routing", "protocols", "ip_addressing"],
};

const sanitizeMockTagFragment = (fragment) => {
  const words = String(fragment || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !MOCK_TAG_STOP_WORDS.has(word) && word.length > 2)
    .slice(0, 3);

  if (words.length === 0) {
    return "";
  }

  return normalizeTag(words.join("_ ")).slice(0, 32).replace(/_+$/g, "");
};

const getMockFallbackTags = (course) => {
  const courseDescriptor =
    `${course.code || ""} ${course.name || ""} ${course.outlineText || ""}`.toLowerCase();

  for (const [keyword, tags] of Object.entries(MOCK_TAG_FALLBACKS)) {
    if (keyword !== "default" && courseDescriptor.includes(keyword)) {
      return tags;
    }
  }

  return MOCK_TAG_FALLBACKS.default;
};

const buildTagsFromCourse = (course) => {
  const cleanedTags = Array.from(
    new Set(
      String(course.outlineText || "")
        .split(/[,.;\n]/)
        .map((part) => sanitizeMockTagFragment(part))
        .filter(Boolean),
    ),
  ).slice(0, 8);

  if (cleanedTags.length >= 3) {
    return cleanedTags;
  }

  return getMockFallbackTags(course);
};

const getCourseContext = async (courseId, sourceContext, course) => {
  // Placeholder for future RAG retrieval: this is where Pinecone/pgvector similarity
  // search will fetch the most relevant note chunks for the selected course/materials.
  const selectedContext = sourceContext
    ? JSON.stringify(sourceContext)
    : "No specific lecture note filters were provided.";

  return [
    `Course: ${course.code} - ${course.name}`,
    `Instructor: ${course.instructor || "Unknown"}`,
    `Outline: ${course.outlineText || "No outline available."}`,
    `Selected source context: ${selectedContext}`,
    "Retrieved academic snippet: Students are expected to explain concepts precisely, compare related methods, and justify why a given solution is correct or incorrect using course terminology.",
  ].join("\n\n");
};

const buildQuizGenerationUserPrompt = ({
  course,
  numberOfQuestions,
  difficulty,
  questionType,
  courseContext,
}) => {
  return `Generate a new practice quiz for this course.

Course metadata:
- Course code: ${course.code}
- Course name: ${course.name}
- Semester: ${course.semester || "Unknown"}

Generation settings:
- Number of questions: ${numberOfQuestions}
- Difficulty: ${difficulty}
- Question type: ${questionType}

Retrieved course context:
${courseContext}

Return JSON with:
- title: a concise quiz title
- description: one sentence describing what this quiz covers
- questions: an array with exactly ${numberOfQuestions} questions

Remember:
- Every question must include 1 to 3 specific subTopicTags using the exact key subTopicTags.
- Those tags must be micro-topic labels, not broad domains.
- Keep the output strictly JSON.`;
};

const buildMockQuizPayload = ({
  course,
  numberOfQuestions,
  difficulty,
  questionType,
}) => {
  const baseTags = buildTagsFromCourse(course);
  const mixedQuestionTypes = [
    "mcq",
    "true_false",
    "short_answer",
    "multiple_select",
  ];

  return {
    title: `${course.code} Practice Quiz`,
    description: `AI-generated practice set for ${course.name}`,
    questions: Array.from({ length: numberOfQuestions }, (_, index) => {
      const resolvedQuestionType =
        questionType === "all"
          ? mixedQuestionTypes[index % mixedQuestionTypes.length]
          : normalizeGeneratedQuestionType(questionType);
      const tagA =
        baseTags[index % Math.max(baseTags.length, 1)] || "core_concept";
      const tagB =
        baseTags[(index + 1) % Math.max(baseTags.length, 1)] ||
        "applied_reasoning";
      const questionId = `q-${index + 1}`;

      if (resolvedQuestionType === "true_false") {
        return {
          questionId,
          prompt: `True or false: ${course.name} concept ${index + 1} can be justified directly from the provided course material.`,
          type: "true_false",
          difficulty,
          options: [],
          correctAnswer: true,
          explanation: `This statement aligns with the retrieved ${tagA} material.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 75 : 45,
          subTopicTags: [tagA, tagB].slice(0, 2),
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      if (resolvedQuestionType === "short_answer") {
        return {
          questionId,
          prompt: `Briefly explain the key idea behind ${tagA.replace(/_/g, " ")} in ${course.name}.`,
          type: "short_answer",
          difficulty,
          options: [],
          correctAnswer: `${tagA.replace(/_/g, " ")} explanation`,
          explanation: `A strong answer should define ${tagA.replace(/_/g, " ")} precisely and relate it to the course context.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 90 : 60,
          subTopicTags: [tagA],
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      if (resolvedQuestionType === "multiple_select") {
        return {
          questionId,
          prompt: `Select all statements that correctly describe ${tagA.replace(/_/g, " ")}.`,
          type: "multiple_select",
          difficulty,
          options: [
            {
              key: "A",
              text: `Correct statement about ${tagA.replace(/_/g, " ")}`,
            },
            {
              key: "B",
              text: `Incorrect statement about ${tagA.replace(/_/g, " ")}`,
            },
            {
              key: "C",
              text: `Another correct statement about ${tagB.replace(/_/g, " ")}`,
            },
            { key: "D", text: "Distractor option unrelated to the context" },
          ],
          correctAnswer: ["A", "C"],
          explanation: `The correct selections align with ${tagA} and ${tagB}.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 80 : 55,
          subTopicTags: [tagA, tagB].slice(0, 2),
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      return {
        questionId,
        prompt: `Which statement best matches ${tagA.replace(/_/g, " ")} in ${course.name}?`,
        type: resolvedQuestionType,
        difficulty,
        options: [
          {
            key: "A",
            text: `Correct interpretation of ${tagA.replace(/_/g, " ")}`,
          },
          { key: "B", text: "Common misconception option" },
          { key: "C", text: "Partially related but inaccurate option" },
          { key: "D", text: "Irrelevant distractor" },
        ],
        correctAnswer: "A",
        explanation: `Option A best reflects the course treatment of ${tagA.replace(/_/g, " ")}.`,
        points: 1,
        estimatedSeconds: difficulty === "hard" ? 70 : 50,
        subTopicTags: [tagA, tagB].slice(0, 2),
        sourceChunks: ["retrieved_chunk_1"],
      };
    }),
  };
};

const shouldFallbackToMock = (error) => {
  const errorMessage = String(error?.message || "").toLowerCase();

  return (
    error?.code === "MISSING_API_KEY" ||
    error?.code === "INVALID_QUIZ_JSON" ||
    error?.code === "INVALID_QUIZ_PAYLOAD" ||
    error?.code === "QUIZ_GENERATION_FAILED" ||
    errorMessage.includes("api key expired") ||
    errorMessage.includes("api_key_invalid") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("failed to generate quiz with gemini") ||
    errorMessage.includes("failed to parse quiz json")
  );
};

const callGeminiForQuiz = async ({ systemPrompt, userPrompt, timeoutMs }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error("Missing GEMINI_API_KEY for live quiz generation");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError;

  for (const modelId of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const response = await withTimeout(
        model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
        timeoutMs,
        "Timed out while waiting for quiz generation",
      );

      return response.response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to generate quiz with Gemini");
};

const sanitizeQuestion = (question, index, fallbackDifficulty) => {
  const normalizedType = normalizeGeneratedQuestionType(question.type);
  const normalizedDifficulty = normalizeDifficulty(
    question.difficulty || fallbackDifficulty,
  );
  const subTopicTags = Array.from(
    new Set(
      (Array.isArray(question.subTopicTags) ? question.subTopicTags : [])
        .map((tag) => normalizeTag(tag))
        .filter(Boolean),
    ),
  ).slice(0, 3);

  if (subTopicTags.length === 0) {
    throw new Error(`Generated question ${index + 1} is missing subTopicTags`);
  }

  const normalizedQuestion = {
    questionId: String(question.questionId || `generated-${index + 1}`)
      .trim()
      .toLowerCase(),
    prompt: String(question.prompt || "").trim(),
    type: normalizedType,
    difficulty: normalizedDifficulty,
    options: [],
    correctAnswer: question.correctAnswer,
    explanation: String(question.explanation || "").trim(),
    points: Math.max(1, Number.parseInt(question.points, 10) || 1),
    estimatedSeconds: Math.max(
      15,
      Number.parseInt(question.estimatedSeconds, 10) || 60,
    ),
    subTopicTags,
    sourceChunks: Array.isArray(question.sourceChunks)
      ? question.sourceChunks
          .map((chunk) => String(chunk).trim())
          .filter(Boolean)
      : [],
  };

  if (!normalizedQuestion.prompt) {
    throw new Error(`Generated question ${index + 1} is missing a prompt`);
  }

  if (!normalizedQuestion.explanation) {
    throw new Error(
      `Generated question ${index + 1} is missing an explanation`,
    );
  }

  if (normalizedType === "mcq" || normalizedType === "multiple_select") {
    const options = Array.isArray(question.options) ? question.options : [];

    if (options.length !== 4) {
      throw new Error(
        `Generated question ${index + 1} must include exactly 4 options for ${normalizedType}`,
      );
    }

    normalizedQuestion.options = options.map((option, optionIndex) => ({
      key: String(option.key || String.fromCharCode(65 + optionIndex)).trim(),
      text: String(option.text || "").trim(),
    }));

    if (normalizedType === "multiple_select") {
      normalizedQuestion.correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.map((answer) => String(answer).trim())
        : [String(question.correctAnswer || "").trim()].filter(Boolean);
    } else {
      normalizedQuestion.correctAnswer = String(
        question.correctAnswer || "",
      ).trim();
    }
  } else if (normalizedType === "true_false") {
    normalizedQuestion.options = [];
    normalizedQuestion.correctAnswer =
      typeof question.correctAnswer === "boolean"
        ? question.correctAnswer
        : String(question.correctAnswer).trim().toLowerCase() === "true";
  } else {
    normalizedQuestion.options = [];
    normalizedQuestion.correctAnswer = String(
      question.correctAnswer || "",
    ).trim();
  }

  return normalizedQuestion;
};

const parseQuizGenerationResponse = (responseText, fallbackDifficulty) => {
  let parsedPayload;

  try {
    parsedPayload = JSON.parse(extractJsonObject(responseText));
  } catch (error) {
    const parseError = new Error(`Failed to parse quiz JSON: ${error.message}`);
    parseError.code = "INVALID_QUIZ_JSON";
    throw parseError;
  }

  if (
    !Array.isArray(parsedPayload.questions) ||
    parsedPayload.questions.length === 0
  ) {
    const error = new Error("Quiz generation returned no questions");
    error.code = "INVALID_QUIZ_PAYLOAD";
    throw error;
  }

  return {
    title: String(parsedPayload.title || "Generated Practice Quiz").trim(),
    description: String(
      parsedPayload.description || "AI-generated practice quiz",
    ).trim(),
    questions: parsedPayload.questions.map((question, index) =>
      sanitizeQuestion(question, index, fallbackDifficulty),
    ),
  };
};

const generatePracticeQuiz = async ({
  userId,
  courseId,
  numberOfQuestions,
  difficulty,
  questionType,
  sourceContext,
  useMock,
  timeoutMs,
}) => {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const normalizedQuestionType = normalizeQuestionType(questionType);
  const normalizedQuestionCount = normalizeQuestionCount(numberOfQuestions);
  const course = await Course.findOne({ _id: courseId, userId });

  if (!course) {
    const error = new Error("Course not found for this user");
    error.code = "COURSE_NOT_FOUND";
    throw error;
  }

  const courseContext = await getCourseContext(courseId, sourceContext, course);
  const userPrompt = buildQuizGenerationUserPrompt({
    course,
    numberOfQuestions: normalizedQuestionCount,
    difficulty: normalizedDifficulty,
    questionType: normalizedQuestionType,
    courseContext,
  });

  let parsedQuizPayload;

  try {
    if (useMock || !process.env.GEMINI_API_KEY) {
      parsedQuizPayload = buildMockQuizPayload({
        course,
        numberOfQuestions: normalizedQuestionCount,
        difficulty: normalizedDifficulty,
        questionType: normalizedQuestionType,
      });
    } else {
      const rawResponse = await callGeminiForQuiz({
        systemPrompt: QUIZ_GENERATION_SYSTEM_PROMPT,
        userPrompt,
        timeoutMs: timeoutMs || DEFAULT_GENERATION_CONFIG.timeoutMs,
      });

      parsedQuizPayload = parseQuizGenerationResponse(
        rawResponse,
        normalizedDifficulty,
      );
    }
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      console.warn(
        "Falling back to mock quiz generation because live AI generation failed:",
        error.message,
      );

      parsedQuizPayload = buildMockQuizPayload({
        course,
        numberOfQuestions: normalizedQuestionCount,
        difficulty: normalizedDifficulty,
        questionType: normalizedQuestionType,
      });
    } else {
      if (!error.code) {
        error.code = "QUIZ_GENERATION_FAILED";
      }
      throw error;
    }
  }

  const questions = parsedQuizPayload.questions.map((question, index) =>
    sanitizeQuestion(question, index, normalizedDifficulty),
  );
  const estimatedDurationMinutes = Math.max(
    1,
    Math.ceil(
      questions.reduce(
        (totalSeconds, question) => totalSeconds + question.estimatedSeconds,
        0,
      ) / 60,
    ),
  );
  const subTopicCoverage = Array.from(
    new Set(questions.flatMap((question) => question.subTopicTags)),
  );

  const quiz = await Quiz.create({
    userId,
    courseId,
    title: parsedQuizPayload.title,
    description: parsedQuizPayload.description,
    generationType: "rag_generated",
    questionTypeFilter: normalizedQuestionType,
    difficulty:
      normalizedQuestionType === "all" ? "mixed" : normalizedDifficulty,
    questions,
    totalQuestions: questions.length,
    estimatedDurationMinutes,
    subTopicCoverage,
    recommendedBySystem: false,
    sourceContext: {
      materialIds: Array.isArray(sourceContext?.materialIds)
        ? sourceContext.materialIds
        : [],
      retrievalQuery: userPrompt,
      generatedAt: new Date(),
    },
  });

  return {
    quiz,
    prompt: {
      system: QUIZ_GENERATION_SYSTEM_PROMPT,
      user: userPrompt,
    },
    retrievalContext: courseContext,
  };
};

module.exports = {
  DEFAULT_GENERATION_CONFIG,
  QUIZ_GENERATION_SYSTEM_PROMPT,
  buildQuizGenerationUserPrompt,
  generatePracticeQuiz,
  getCourseContext,
  normalizeDifficulty,
  normalizeGeneratedQuestionType,
  normalizeQuestionCount,
  normalizeQuestionType,
  parseQuizGenerationResponse,
};
