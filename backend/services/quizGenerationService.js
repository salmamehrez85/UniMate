const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../model/Course");
const Quiz = require("../model/Quiz");

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
].filter(Boolean);
const QUIZ_GENERATION_SYSTEM_PROMPT = `You are UniMate's expert professor-grade quiz generator.

Your job is to create smart, reliable practice quizzes based strictly on the retrieved course material. You must prioritize high-yield concepts that test deep application and critical thinking.

## Question Generation Strategy (CRITICAL):
1. **Scenario-Based Testing**: To test understanding rather than recall, you MUST invent realistic, hypothetical scenarios (e.g., a specific engineering problem, a patient case, a code bug, a business dilemma) that require the student to APPLY the course concepts to solve. 
2. **Ban on Lazy Formats**: You are STRICTLY FORBIDDEN from generating questions that use the following formats:
   - "Which of the following is NOT..."
   - "All of the above" / "None of the above"
   - "What is the definition of..."
   - Simple True/False fact-checking
3. **Plausible Distractors**: For MCQ/multiple_select, wrong answers must represent actual, common student misconceptions or logical errors based on the scenario. Do not use obvious throwaway options.
4. **Scope Integrity**: While you MUST invent hypothetical scenarios for the question prompts, the underlying rules, formulas, and concepts required to arrive at the correct answer must be found STRICTLY in the provided course material. Do not introduce outside academic concepts.

## Content & Quality Rules:
1. Question prompts should be 2-4 sentences: establish the scenario, then ask the question.
2. Explanations must be educational: state why the answer is correct and explicitly break down the logical flaw in the hardest distractor.
3. Balance the mix: 20% fundamental concept application (medium), 60% scenario-based problem solving (hard), 20% complex analysis (hard). 
4. Maintain academic correctness. A question should reward deep understanding, not penalize careful reading.

## Non-Negotiable JSON Formatting Rules:
1. Return valid JSON ONLY. No markdown formatting, no code fences (\`\`\`), no introductory or concluding commentary.
2. The top-level JSON object must contain exactly: "title", "description", "questions".
3. "questions" must be an array of objects matching this exact structure:
   {
     "questionId": string, // short, unique, slug-like (e.g., "q-bst-deletion-1")
     "prompt": string,
     "type": "mcq" | "true_false" | "short_answer" | "multiple_select",
     "difficulty": "medium" | "hard", // Exclude "easy" to maintain rigor
     "options": [{ "key": string, "text": string }],
     "correctAnswer": string | boolean | string[],
     "explanation": string,
     "points": number,
     "estimatedSeconds": number,
     "subTopicTags": string[],
     "sourceChunks": string[]
   }
4. For "mcq" and "multiple_select", options must contain exactly 4 concise choices.
5. For "true_false", options must be an empty array []. correctAnswer must be a boolean. (Use sparingly, only for complex applied logic, not fact recall).
6. For "short_answer", options must be an empty array []. correctAnswer must be a short, canonical string.

## Tagging Rules:
1. Every question must include 1 to 3 highly specific micro-tags in subTopicTags (e.g., "avl_rotations", "chain_rule", "inner_join_filtering").
2. NEVER use broad tags like "math", "programming", or "database".`;

const DEFAULT_GENERATION_CONFIG = {
  timeoutMs: 30000,
  extractionTimeoutMs: 300000, // extraction can be slow for large PDFs (2 × 2MB needs ~2-3 min)
  lectureQuizTimeoutMs: 90000, // quiz gen on large extracted text needs more time
  maxLectureContentChars: 18000, // ~4500 tokens — keeps prompt well within limits
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

  if (firstBraceIndex === -1) {
    throw new Error("The AI response did not contain valid JSON");
  }

  // Walk forward counting brace depth so we find the *matching* closing brace
  // instead of the last `}` in the string (which may include trailing text).
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBraceIndex; i < withoutFences.length; i++) {
    const char = withoutFences[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return withoutFences.slice(firstBraceIndex, i + 1);
      }
    }
  }

  throw new Error("The AI response did not contain valid JSON");
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

// Reads up to 5 uploaded lecture/note files from disk and returns Gemini inlineData parts.
const readLectureFilesAsInlineParts = (lectures = []) => {
  const MAX_LECTURE_FILES = 5;
  const parts = [];

  for (const lecture of lectures.slice(0, MAX_LECTURE_FILES)) {
    try {
      const filePath = path.join(
        __dirname,
        "../uploads/lectures",
        lecture.filename,
      );

      const fileExists = fs.existsSync(filePath);
      if (!fileExists) {
        console.warn(`[❌ FILE NOT FOUND] ${filePath}`);
        continue;
      }
      const data = fs.readFileSync(filePath).toString("base64");
      const sizeKB = Math.round((data.length * 3) / 4 / 1024);

      parts.push({ inlineData: { mimeType: lecture.mimeType, data } });
    } catch (err) {
      console.error(
        `[❌ READ ERROR] "${lecture.originalName}": ${err.message}`,
      );
    }
  }

  return parts;
};

// Step 1 of the two-step lecture quiz flow.
// Calls Gemini WITHOUT responseMimeType:"application/json" so it can freely
// read PDF/image inline data and return thorough plain-text content extraction.
const extractLectureContent = async (inlineParts) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || inlineParts.length === 0) {
    return null;
  }

  const extractionPrompt = `You are a thorough academic content extractor for university courses.

Read ALL the attached lecture files completely and extract:
1. Every key concept, definition, theorem, formula, algorithm, and rule — quoted exactly as written
2. All worked examples with their full solutions and explanations
3. Every numbered/bulleted list of principles, steps, or properties
4. Important relationships, comparisons, and distinctions between concepts
5. Any tables or structured data

Format as plain text with clear labeled sections.
Be exhaustive — do NOT summarize or omit details.
A student must be able to answer an exam solely from what you extract.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError;

  for (const modelId of GEMINI_MODEL_CANDIDATES) {
    const attemptStart = Date.now();
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const response = await withTimeout(
        model.generateContent({
          contents: [
            {
              role: "user",
              // Lecture files first, then the extraction instruction
              parts: [...inlineParts, { text: extractionPrompt }],
            },
          ],
          generationConfig: { temperature: 0.1 },
          // NO responseMimeType — free-form text so Gemini reads PDFs fully
        }),
        DEFAULT_GENERATION_CONFIG.extractionTimeoutMs,
        "Timed out while extracting lecture content",
      );
      const elapsed = Date.now() - attemptStart;
      const extracted = response.response.text();

      if (extracted && extracted.trim().length > 100) {
        // Truncate to avoid exceeding token limits in the subsequent quiz call
        const text = extracted.trim();
        const result =
          text.length > DEFAULT_GENERATION_CONFIG.maxLectureContentChars
            ? text.slice(0, DEFAULT_GENERATION_CONFIG.maxLectureContentChars) +
              "\n\n[Content truncated for length]"
            : text;

        return result;
      }
    } catch (err) {
      const elapsed = Date.now() - attemptStart;
      console.error(
        `[❌ MODEL FAILED] ${modelId} in ${elapsed}ms: ${err.message}`,
      );
      lastError = err;
    }
  }

  console.error(
    "[Extraction] All models failed. Last error:",
    lastError?.status,
    lastError?.message,
  );
  return null;
};

const getCourseContext = async (
  courseId,
  sourceContext,
  course,
  lectureContent = null,
) => {
  // Placeholder for future RAG retrieval: this is where Pinecone/pgvector similarity
  // search will fetch the most relevant note chunks for the selected course/materials.
  const selectedContext = sourceContext
    ? JSON.stringify(sourceContext)
    : "No specific lecture note filters were provided.";

  const parts = [
    `Course: ${course.code} - ${course.name}`,
    `Instructor: ${course.instructor || "Unknown"}`,
  ];

  if (lectureContent) {
    // Extracted lecture text takes priority over the outline
    parts.push(
      `LECTURE CONTENT (extracted from uploaded files — use this as the PRIMARY source for ALL questions):\n${lectureContent}`,
    );
    if (course.outlineText) {
      parts.push(
        `Course outline (supplementary context):\n${course.outlineText}`,
      );
    }
  } else {
    parts.push(`Outline: ${course.outlineText || "No outline available."}`);
    parts.push(`Selected source context: ${selectedContext}`);
    parts.push(
      "Retrieved academic snippet: Students are expected to explain concepts precisely, compare related methods, and justify why a given solution is correct or incorrect using course terminology.",
    );
  }

  return parts.join("\n\n");
};

const buildQuizGenerationUserPrompt = ({
  course,
  numberOfQuestions,
  difficulty,
  questionType,
  courseContext,
  language,
}) => {
  const languageInstruction =
    language === "ar"
      ? "\n\nIMPORTANT: Generate ALL question prompts, answer options, and explanations in Arabic (العربية). Do NOT use English for any text fields."
      : "";

  const hasLectureContent = courseContext.includes("LECTURE CONTENT");
  const sourceInstruction = hasLectureContent
    ? `\n\nIMPORTANT — LECTURE-BASED GENERATION:
- Questions MUST be grounded in the LECTURE CONTENT section above.
- Every question must reference a specific concept, example, definition, formula, or fact from those materials.
- Do NOT ask vague or generic questions — ask about the actual content covered in the lectures.
- Incorrect answer options must be plausible but clearly wrong based on the lecture material.`
    : "";

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
- Keep the output strictly JSON.${sourceInstruction}${languageInstruction}`;
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

  // Helper to format tag names for human-readable questions
  const formatTagAsLabel = (tag) => {
    return tag
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
          prompt: `True or false: ${formatTagAsLabel(tagA)} is a fundamental principle covered in ${course.name}.`,
          type: "true_false",
          difficulty,
          options: [],
          correctAnswer: true,
          explanation: `${formatTagAsLabel(tagA)} is indeed a key principle in ${course.name}. Students should understand its importance in the course context.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 75 : 45,
          subTopicTags: [tagA, tagB].slice(0, 2),
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      if (resolvedQuestionType === "short_answer") {
        return {
          questionId,
          prompt: `Explain how ${formatTagAsLabel(tagA)} is applied in ${course.name}. Provide at least one specific example.`,
          type: "short_answer",
          difficulty,
          options: [],
          correctAnswer: `${formatTagAsLabel(tagA)} is applied by...`,
          explanation: `A strong answer should reference specific applications of ${formatTagAsLabel(tagA)} taught in this course and provide concrete examples from the material.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 90 : 60,
          subTopicTags: [tagA],
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      if (resolvedQuestionType === "multiple_select") {
        return {
          questionId,
          prompt: `Which of the following correctly describe or apply ${formatTagAsLabel(tagA)}? (Select all that apply)`,
          type: "multiple_select",
          difficulty,
          options: [
            {
              key: "A",
              text: `${formatTagAsLabel(tagA)} directly relates to ${formatTagAsLabel(tagB)}`,
            },
            {
              key: "B",
              text: `${formatTagAsLabel(tagA)} is an outdated concept no longer relevant to ${course.name}`,
            },
            {
              key: "C",
              text: `${formatTagAsLabel(tagA)} requires understanding of foundational principles`,
            },
            {
              key: "D",
              text: `${formatTagAsLabel(tagA)} is only applicable in advanced topics`,
            },
          ],
          correctAnswer: ["A", "C"],
          explanation: `${formatTagAsLabel(tagA)} is a practical concept that connects to other course topics like ${formatTagAsLabel(tagB)}, and it builds on foundational knowledge. It is not outdated and is relevant throughout the course.`,
          points: 1,
          estimatedSeconds: difficulty === "hard" ? 80 : 55,
          subTopicTags: [tagA, tagB].slice(0, 2),
          sourceChunks: ["retrieved_chunk_1"],
        };
      }

      // MCQ with more specific question styles
      const mcqVariations = [
        {
          prompt: `What is the primary purpose of ${formatTagAsLabel(tagA)} in ${course.name}?`,
          optionA: `To establish and apply ${formatTagAsLabel(tagA)} effectively`,
          optionB: `To avoid understanding ${formatTagAsLabel(tagA)}`,
          optionC: `To memorize definitions without application`,
          optionD: `To replace ${formatTagAsLabel(tagB)} entirely`,
          explanation: `${formatTagAsLabel(tagA)} serves a specific purpose in ${course.name}. Understanding this purpose helps students recognize when and how to apply it.`,
        },
        {
          prompt: `How does ${formatTagAsLabel(tagA)} differ from ${formatTagAsLabel(tagB)}?`,
          optionA: `${formatTagAsLabel(tagA)} focuses on one aspect while ${formatTagAsLabel(tagB)} covers a broader area`,
          optionB: `They are identical concepts with different names`,
          optionC: `${formatTagAsLabel(tagA)} is advanced while ${formatTagAsLabel(tagB)} is basic`,
          optionD: `There is no meaningful difference between them`,
          explanation: `${formatTagAsLabel(tagA)} and ${formatTagAsLabel(tagB)} are distinct concepts with different roles in ${course.name}. Understanding their differences is key to mastering the course material.`,
        },
        {
          prompt: `Which scenario best illustrates the application of ${formatTagAsLabel(tagA)}?`,
          optionA: `A situation requiring the principles of ${formatTagAsLabel(tagA)}`,
          optionB: `Any random example unrelated to the course`,
          optionC: `A situation where ${formatTagAsLabel(tagA)} would be inappropriate`,
          optionD: `A topic covered in a different course entirely`,
          explanation: `Recognizing where ${formatTagAsLabel(tagA)} applies is crucial. Students should be able to identify real-world or academic scenarios that require applying this principle.`,
        },
      ];

      const mcqVariation = mcqVariations[index % mcqVariations.length];

      return {
        questionId,
        prompt: mcqVariation.prompt,
        type: resolvedQuestionType,
        difficulty,
        options: [
          { key: "A", text: mcqVariation.optionA },
          { key: "B", text: mcqVariation.optionB },
          { key: "C", text: mcqVariation.optionC },
          { key: "D", text: mcqVariation.optionD },
        ],
        correctAnswer: "A",
        explanation: mcqVariation.explanation,
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
  const status = error?.status;

  return (
    error?.code === "MISSING_API_KEY" ||
    error?.code === "INVALID_QUIZ_JSON" ||
    error?.code === "INVALID_QUIZ_PAYLOAD" ||
    error?.code === "QUIZ_GENERATION_FAILED" ||
    errorMessage.includes("api key expired") ||
    errorMessage.includes("api_key_invalid") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("failed to generate quiz with gemini") ||
    errorMessage.includes("failed to parse quiz json") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("high demand") ||
    errorMessage.includes("overloaded") ||
    errorMessage.includes("internal server error") ||
    // Transient HTTP status codes from Google API
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
};

const callGeminiForQuiz = async ({
  systemPrompt,
  userPrompt,
  timeoutMs,
  inlineParts = [],
}) => {
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
                // Lecture files come first so Gemini reads material before instructions
                ...inlineParts,
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
  language,
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

  // Two-step lecture flow:
  // Step 1 — extract full text from PDFs/images without JSON-mode constraint
  //           (Gemini ignores inline data when responseMimeType:"application/json" is set)
  // Step 2 — inject extracted text into the normal JSON-mode quiz generation call
  const lectureParts = readLectureFilesAsInlineParts(course.lectures || []);
  const lectureContent =
    lectureParts.length > 0 ? await extractLectureContent(lectureParts) : null;

  const courseContext = await getCourseContext(
    courseId,
    sourceContext,
    course,
    lectureContent,
  );
  const userPrompt = buildQuizGenerationUserPrompt({
    course,
    numberOfQuestions: normalizedQuestionCount,
    difficulty: normalizedDifficulty,
    questionType: normalizedQuestionType,
    courseContext,
    language,
  });

  let parsedQuizPayload;

  try {
    if (useMock || !process.env.GEMINI_API_KEY) {
      const reason = useMock
        ? "useMock flag is true"
        : "GEMINI_API_KEY is missing";

      parsedQuizPayload = buildMockQuizPayload({
        course,
        numberOfQuestions: normalizedQuestionCount,
        difficulty: normalizedDifficulty,
        questionType: normalizedQuestionType,
      });
    } else {
      const timeoutVal = lectureContent
        ? DEFAULT_GENERATION_CONFIG.lectureQuizTimeoutMs
        : DEFAULT_GENERATION_CONFIG.timeoutMs;

      const rawResponse = await callGeminiForQuiz({
        systemPrompt: QUIZ_GENERATION_SYSTEM_PROMPT,
        userPrompt,
        // Use a longer timeout when lecture content is present:
        // the prompt is much larger and Gemini needs more time to process it.
        timeoutMs: timeoutMs || timeoutVal,
        // Lecture content is already baked into userPrompt as extracted text;
        // passing inline parts here would conflict with JSON mode.
        inlineParts: [],
      });

      parsedQuizPayload = parseQuizGenerationResponse(
        rawResponse,
        normalizedDifficulty,
      );
    }
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      console.error(
        `[⚠️  FALLBACK] Live generation failed, falling back to MOCK\n  Error: ${error.message}\n`,
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
