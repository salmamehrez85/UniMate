/**
 * AI Prediction Service - Native Node.js
 * Replicates Python prediction logic with Google Gemini API
 */

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = "gemini-2.0-flash";

// Initialize Gemini Client
let genAI;
let model;

console.log("[AI Predictor] GEMINI_API_KEY present:", !!GOOGLE_API_KEY);
console.log(
  "[AI Predictor] API Key format valid:",
  GOOGLE_API_KEY?.startsWith("AIza") ? "✓" : "✗",
);

try {
  genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  model = genAI.getGenerativeModel({ model: MODEL_ID });
  console.log("✓ Gemini AI Client initialized successfully");
} catch (error) {
  console.error("✗ Failed to initialize Gemini Client:", error.message);
}

// ==========================================
// SCHEMA DEFINITIONS (Pydantic equivalent)
// ==========================================

const CourseProfileSchema = {
  type: "object",
  properties: {
    domain_tags: {
      type: "array",
      items: { type: "string" },
      description: "Tags like Programming, Math, Systems, AI, etc.",
    },
    main_topics: {
      type: "array",
      items: { type: "string" },
      description: "3-8 main topics extracted from outline",
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description: "2-6 specific skills learned",
    },
    difficulty: {
      type: "string",
      enum: ["Intro", "Intermediate", "Advanced"],
    },
    assessment_style: {
      type: "string",
      enum: ["Implementation", "Analysis", "Mixed"],
    },
  },
  required: [
    "domain_tags",
    "main_topics",
    "skills",
    "difficulty",
    "assessment_style",
  ],
};

const SimilarCourseSchema = {
  type: "object",
  properties: {
    courseId: { type: "string" },
    similarity_score: {
      type: "number",
      description: "Float between 0.0 and 1.0",
    },
    reason: {
      type: "string",
      description: "Short explanation of why these courses are similar",
    },
  },
  required: ["courseId", "similarity_score", "reason"],
};

const SimilarityRankingSchema = {
  type: "object",
  properties: {
    ranked_past_courses: {
      type: "array",
      items: SimilarCourseSchema,
      description: "List of ranked similar courses",
    },
  },
  required: ["ranked_past_courses"],
};

const RecommendationSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          courseCode: { type: "string" },
          courseName: { type: "string" },
          status: {
            type: "string",
            enum: ["green", "yellow", "red"],
            description:
              "green for on-track, yellow for watch, red for at-risk",
          },
          summaryAdvice: {
            type: "string",
            description:
              "Very short advice (max 20 words) for dashboard. Focus only on the single most urgent task or risk.",
          },
          detailedAnalysis: {
            type: "string",
            description:
              "Deep analysis for modal. Must include: what-if calculations, comparison to historical performance, and specific task/phase mentions.",
          },
        },
        required: [
          "courseCode",
          "courseName",
          "status",
          "summaryAdvice",
          "detailedAnalysis",
        ],
      },
    },
  },
  required: ["recommendations"],
};

const SummarySchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise academic overview that synthesizes the material",
    },
    plainLanguageSummary: {
      type: "string",
      description:
        "A simpler explanation of what the content is really about and why it matters",
    },
    learningOutcomes: {
      type: "array",
      items: { type: "string" },
      description:
        "4-6 concrete abilities or takeaways the student should gain",
    },
    conceptConnections: {
      type: "array",
      items: { type: "string" },
      description:
        "3-5 explanations of how the main topics connect or build on each other",
    },
    examFocus: {
      type: "array",
      items: { type: "string" },
      description: "3-5 high-probability assessment focuses or tricky areas",
    },
    importantTerms: {
      type: "array",
      items: { type: "string" },
      description: "5-10 important terms, concepts, or formulas",
    },
    studyPlan: {
      type: "array",
      items: { type: "string" },
      description: "3-6 ordered study steps",
    },
    possibleQuestions: {
      type: "array",
      items: { type: "string" },
      description: "3-6 likely quiz or exam questions",
    },
    actionItems: {
      type: "array",
      items: { type: "string" },
      description: "3-6 actionable next tasks",
    },
  },
  required: [
    "summary",
    "plainLanguageSummary",
    "learningOutcomes",
    "conceptConnections",
    "examFocus",
    "importantTerms",
    "studyPlan",
    "possibleQuestions",
    "actionItems",
  ],
};

// ==========================================
// LLM CALLS WITH RETRY LOGIC
// ==========================================

/**
 * Call LLM with exponential backoff retry for 429 errors
 */
const callLLMWithRetry = async (prompt, schema, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add 1 second delay before each attempt to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
        },
      });

      const text = response.response.text();
      return JSON.parse(text);
    } catch (error) {
      const errorMessage = error.message || "";

      // Handle 429 rate limit errors
      if (errorMessage.includes("429") || errorMessage.includes("exhausted")) {
        const backoffMs = 4000 * (attempt + 1);
        console.warn(`Rate limited. Waiting ${backoffMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else if (attempt === maxRetries - 1) {
        // Last attempt failed, throw error
        throw error;
      } else {
        // Other errors, just retry
        console.warn(
          `LLM call failed (attempt ${attempt + 1}):`,
          error.message,
        );
      }
    }
  }

  return null;
};

/**
 * Generate semantic profile for a course using LLM
 */
const generateCourseProfile = async (courseName, outlineText) => {
  try {
    const prompt = `Analyze this course outline and extract semantic characteristics.
Course Name: ${courseName}
Outline: ${outlineText}

Return a JSON object with:
- domain_tags: List of domain tags (e.g., "Programming", "Math", "Systems")
- main_topics: 3-8 main topics covered in the course
- skills: 2-6 specific skills students learn
- difficulty: One of "Intro", "Intermediate", "Advanced"
- assessment_style: One of "Implementation", "Analysis", "Mixed"`;

    const result = await callLLMWithRetry(prompt, CourseProfileSchema);

    if (!result) {
      // Fallback profile if LLM fails
      return {
        domain_tags: [],
        main_topics: [],
        skills: [],
        difficulty: "Intermediate",
        assessment_style: "Mixed",
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to generate course profile:", error.message);
    // Return fallback
    return {
      domain_tags: [],
      main_topics: [],
      skills: [],
      difficulty: "Intermediate",
      assessment_style: "Mixed",
    };
  }
};

/**
 * Preset computer science keywords/topics database
 */
const CS_KEYWORDS_DB = {
  "data structures": [
    "data structure",
    "array",
    "linked list",
    "tree",
    "graph",
    "hash",
    "queue",
    "stack",
  ],
  algorithms: [
    "algorithm",
    "sorting",
    "searching",
    "dynamic programming",
    "greedy",
    "divide conquer",
  ],
  systems: [
    "operating system",
    "os",
    "process",
    "memory",
    "cpu",
    "threading",
    "concurrency",
  ],
  databases: ["database", "dbms", "sql", "query", "transaction", "index"],
  networks: ["network", "tcp", "ip", "socket", "protocol", "http"],
  programming: [
    "programming",
    "language",
    "python",
    "java",
    "c++",
    "javascript",
    "coding",
  ],
};

/**
 * Fallback basic keyword matching for finding similar courses
 * Works when Gemini API is unavailable
 */
const findSimilarCoursesFallback = (currentObj, pastObjs) => {
  const currentTopics = (currentObj.profile?.main_topics || [])
    .concat(currentObj.profile?.skills || [])
    .map((t) => t.toLowerCase());

  // Extract keywords from outline text
  const extractKeywords = (text) => {
    if (!text || typeof text !== "string") return [];
    return text
      .toLowerCase()
      .split(/\s+|,|;|\.|\//)
      .filter(
        (w) =>
          w.length > 3 &&
          ![
            "covers",
            "includes",
            "such",
            "like",
            "core",
            "based",
            "including",
          ].includes(w),
      );
  };

  const currentOutlineKeywords = extractKeywords(currentObj.outline_text);

  console.log(
    "Current course keywords from outline:",
    currentOutlineKeywords.slice(0, 10),
  );

  const scored = pastObjs.map((past) => {
    const pastTopics = (past.profile?.main_topics || [])
      .concat(past.profile?.skills || [])
      .map((t) => t.toLowerCase());

    const pastOutlineKeywords = extractKeywords(past.outline_text);

    // Try profile-based matching first
    let commonTopics = currentTopics.filter((t) =>
      pastTopics.some((p) => p.includes(t) || t.includes(p)),
    );

    // If profiles empty, try outline keyword matching
    if (
      commonTopics.length === 0 &&
      currentOutlineKeywords.length > 0 &&
      pastOutlineKeywords.length > 0
    ) {
      commonTopics = currentOutlineKeywords.filter((w) =>
        pastOutlineKeywords.includes(w),
      );
      console.log(
        `Matching ${currentObj.name} with ${past.name} via outline keywords: ${commonTopics.length} matches`,
      );
    }

    // If still nothing, try preset CS keywords database
    if (commonTopics.length === 0) {
      let keywordMatches = 0;
      for (const [category, keywords] of Object.entries(CS_KEYWORDS_DB)) {
        const currentHasCategory = currentOutlineKeywords.some((w) =>
          keywords.some((k) => w.includes(k) || k.includes(w)),
        );
        const pastHasCategory = pastOutlineKeywords.some((w) =>
          keywords.some((k) => w.includes(k) || k.includes(w)),
        );
        if (currentHasCategory && pastHasCategory) {
          keywordMatches++;
          commonTopics.push(category);
        }
      }
    }

    // Calculate similarity score
    const denominator = Math.max(
      currentTopics.length || currentOutlineKeywords.length || 1,
      pastTopics.length || pastOutlineKeywords.length || 1,
    );

    const similarityScore = Math.min(
      1.0,
      Math.max(0, commonTopics.length / denominator),
    );

    return {
      courseId: past.id,
      name: past.name,
      similarity: similarityScore,
      reason:
        commonTopics.length > 0
          ? `Shares topics: ${[...new Set(commonTopics)].slice(0, 3).join(", ")}`
          : `Related course in computer science`,
    };
  });

  // Return top 3 by similarity
  const ranked = scored.sort((a, b) => b.similarity - a.similarity).slice(0, 3);

  console.log(
    "Fallback similarity results:",
    ranked.map((r) => ({
      name: r.name,
      similarity: Math.round(r.similarity * 100) + "%",
    })),
  );

  return {
    ranked_past_courses: ranked.map((r) => ({
      courseId: r.courseId,
      similarity_score: r.similarity,
      reason: r.reason,
    })),
  };
};

/**
 * Find similar courses using LLM semantic comparison
 */
const findSimilarCourses = async (currentObj, pastObjs) => {
  try {
    const pastCoursesJson = JSON.stringify(pastObjs, null, 2);
    const currentCourseJson = JSON.stringify(currentObj, null, 2);

    const prompt = `Compare the CURRENT COURSE with PAST COURSES and rank by similarity.

CURRENT COURSE:
${currentCourseJson}

PAST COURSES:
${pastCoursesJson}

Task: Identify the TOP 3 most similar past courses based on skills, topics, and difficulty.
For each similar course, provide:
- courseId: The course ID from the past_objs
- similarity_score: A float between 0.0 (very different) and 1.0 (very similar)
- reason: A short explanation of why they are similar (mention overlapping skills/topics)

Return JSON with a "ranked_past_courses" array.`;

    const result = await callLLMWithRetry(prompt, SimilarityRankingSchema);

    if (
      !result ||
      !result.ranked_past_courses ||
      result.ranked_past_courses.length === 0
    ) {
      // Fallback to basic keyword matching when AI fails
      console.warn(
        "AI similarity matching failed or returned empty. Using fallback keyword matching.",
      );
      return findSimilarCoursesFallback(currentObj, pastObjs);
    }

    return result;
  } catch (error) {
    console.error("Failed to find similar courses with AI:", error.message);
    // Fallback to basic keyword matching
    return findSimilarCoursesFallback(currentObj, pastObjs);
  }
};

// ==========================================
// PREDICTION CALCULATION
// ==========================================

/**
 * Main prediction logic - replicates Python calculate_prediction function
 *
 * Formula: pred_pct = (0.5 * (current_avg + avg_bias)) + (0.5 * avg_past_final)
 *
 * Where:
 *   - avg_bias = weighted average of (final - quizAvg) across similar courses
 *   - avg_past_final = weighted average of past final grades across similar courses
 *   - Weights are the similarity scores
 */
const calculateAIPrediction = async (activeCourse, pastCourses) => {
  try {
    const currentAvg = activeCourse.current_performance ?? 70;

    // 1. Generate profile for active course
    const activeProfile = await generateCourseProfile(
      activeCourse.name,
      activeCourse.outline_text || activeCourse.name,
    );

    const targetObj = {
      id: activeCourse.code,
      name: activeCourse.name,
      profile: activeProfile,
      outline_text: activeCourse.outline_text || activeCourse.name,
    };

    // 2. Generate profiles for all past courses
    const historyObjs = [];
    const pastDataMap = {};

    for (const past of pastCourses) {
      const pCode = past.code;

      pastDataMap[pCode] = {
        quiz_avg: past.current_performance ?? past.final_grade ?? 70,
        final_pct: past.final_grade ?? 70,
      };

      const pProfile = await generateCourseProfile(
        past.name,
        past.outline_text || past.name,
      );

      historyObjs.push({
        id: pCode,
        name: past.name,
        profile: pProfile,
        outline_text: past.outline_text || past.name,
      });
    }

    // 3. Rank past courses by similarity
    const ranking = await findSimilarCourses(targetObj, historyObjs);

    // 4. Calculate weighted prediction
    let weightedBias = 0;
    let weightedFinal = 0;
    let totalSim = 0;
    const similarCoursesOutput = [];

    for (const item of ranking.ranked_past_courses) {
      const pid = item.courseId;

      if (!pastDataMap[pid]) continue;

      const sim = item.similarity_score;
      const d = pastDataMap[pid];

      // BIAS = Final Grade % - Quiz Average %
      const bias = d.final_pct - d.quiz_avg;

      weightedBias += bias * sim;
      weightedFinal += d.final_pct * sim;
      totalSim += sim;

      // Find course name
      const courseName = pastCourses.find((c) => c.code === pid)?.name || pid;

      similarCoursesOutput.push({
        name: courseName,
        similarity: sim,
        reason: item.reason,
      });
    }

    let predPct;
    let confidence;

    if (totalSim === 0) {
      predPct = currentAvg;
      confidence = "Low";
    } else {
      const avgBias = weightedBias / totalSim;
      const avgPastFinal = weightedFinal / totalSim;

      // MAIN FORMULA:
      // pred_pct = 0.5 * (current_avg + avg_bias) + 0.5 * avg_past_final
      predPct = 0.5 * (currentAvg + avgBias) + 0.5 * avgPastFinal;

      // Confidence based on similarity coverage
      confidence = totalSim > 1.5 ? "High" : "Medium";
    }

    // Clamp to valid percentage range [0, 100]
    predPct = Math.max(0, Math.min(100, predPct));

    // Ensure we have valid numbers
    const finalPredictedScore =
      isNaN(predPct) || predPct === undefined ? currentAvg : predPct;

    return {
      predicted_score_pct: Math.round(finalPredictedScore * 100) / 100,
      confidence,
      similar_courses: similarCoursesOutput,
    };
  } catch (error) {
    console.error("AI Prediction calculation error:", error);

    // Return fallback prediction with error flag
    return {
      predicted_score_pct: activeCourse.current_performance ?? 70,
      confidence: "Low",
      similar_courses: [],
      error: error.message,
    };
  }
};

const generateActionableRecommendations = async (activeCourses) => {
  try {
    if (!activeCourses || activeCourses.length === 0) {
      return { recommendations: [] };
    }

    // Build simplified course data for the LLM
    const coursesData = activeCourses.map((course) => {
      // Count pending and completed tasks
      const tasks = course.tasks || [];
      const completedTasks = tasks.filter(
        (t) => t.status === "done" || t.completed === true,
      ).length;
      const pendingTasks = tasks.length - completedTasks;

      // Extract specific pending tasks with titles and due dates
      const pendingDeadlines = [];
      tasks.forEach((task) => {
        if (task.status !== "done" && !task.completed) {
          pendingDeadlines.push({
            title: task.title || "Untitled Task",
            dueDate: task.dueDate,
            type: "Task",
          });
        }
      });

      // Extract incomplete project phases (using correct schema fields)
      const phases = course.phases || [];
      phases.forEach((phase) => {
        const requirements = phase.requirements || [];
        const hasIncomplete = requirements.some((r) => !r.completed);
        if (hasIncomplete) {
          pendingDeadlines.push({
            title: phase.title || "Project Phase",
            dueDate: phase.dueDate,
            type: "Phase",
          });
        }
      });

      // Keep only top 3 deadlines to avoid token overload
      const topDeadlines = pendingDeadlines.slice(0, 3);

      // Get recent assessment performance
      const assessments = course.assessments || [];
      const recentAssessments = assessments.slice(-3).map((a) => ({
        type: a.type,
        score: a.score,
        maxScore: a.maxScore,
        percentage:
          a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0,
      }));

      return {
        courseCode: course.code || "UNKNOWN",
        courseName: course.name || "Unknown Course",
        currentGradePercentage: course.currentPerformance || 0,
        completedTasks,
        pendingTasks,
        pendingDeadlines: topDeadlines,
        recentAssessments,
      };
    });

    // Check if Gemini API key is available
    const hasGeminiKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0;

    if (!hasGeminiKey) {
      // Use intelligent fallback without Gemini
      return generateFallbackRecommendations(coursesData);
    }

    const coursesJson = JSON.stringify(coursesData, null, 2);
    const todayDate = new Date().toLocaleDateString();

    const prompt = `You are a data-driven academic advisor. Analyze the following student's active courses and provide TWO types of advice per course.

STUDENT'S ACTIVE COURSES:
${coursesJson}

⚠️ CRITICAL: You must return TWO distinct fields for EACH course:

1️⃣ "summaryAdvice" (Dashboard Quick Action):
   - MAX 20 WORDS. Be blunt and fast.
   - Start with "Grade: X%" to make the percentage clear.
   - If a deadline has already passed (date is before today, ${todayDate}), say "OVERDUE!" instead of the date.
   - Focus ONLY on the single most urgent task or risk.
   - Examples:
     ✅ "Grade: 93%. 'Dart Task 1' OVERDUE!"
     ✅ "At-risk (15%). Contact instructor NOW."
     ✅ "Grade: 88%. 'Final Project' due March 5."
   - DO NOT write full sentences or be verbose.

2️⃣ "detailedAnalysis" (Modal Deep Dive):
   - Act like a data scientist. Use 'pendingDeadlines' and 'recentAssessments' to calculate specific goals.
   - Check if deadlines are overdue (before ${todayDate}) and mention "OVERDUE since [date]" to emphasize urgency.
   - MUST include:
     a) What-If Scenario: Tell the student what grade they need on remaining work to maintain/improve their current trend.
     b) Historical Comparison: Reference how this performance compares to typical patterns.
     c) Specific Tasks/Phases: Mention at least one item from 'pendingDeadlines' by exact name and date/overdue status.
   - Examples:
     ✅ "You're at 93% with 'Dart Task 1' OVERDUE since 2/24/2026. Submit this immediately as late submissions may lose points. To maintain a 90%+ final grade, you need to score at least 85% on remaining assessments. Your current performance is strong—complete this task now to protect your grade."
     ✅ "At 0%, you need to score 75%+ on all remaining work to pass. 'Math Quiz 1' is due March 1—prioritize this immediately. Historical data shows students starting late rarely recover without intensive effort."

Also determine a status:
- "green": Performance 75%+, tasks on track
- "yellow": Performance 60-75% OR pending tasks piling up
- "red": Performance below 60% OR critical deadlines

Return JSON with both 'summaryAdvice' and 'detailedAnalysis' for each course.`;

    const result = await callLLMWithRetry(prompt, RecommendationSchema);

    if (!result) {
      return generateFallbackRecommendations(coursesData);
    }

    // Validate result has recommendations array
    if (!result.recommendations || !Array.isArray(result.recommendations)) {
      return generateFallbackRecommendations(coursesData);
    }

    return result;
  } catch (error) {
    console.error("Failed to generate recommendations:", error.message);
    console.error("Error details:", error);
    // Fallback to intelligent rule-based recommendations
    if (activeCourses && activeCourses.length > 0) {
      const coursesData = activeCourses.map((course) => {
        const tasks = course.tasks || [];
        const completedTasks = tasks.filter(
          (t) => t.status === "done" || t.completed === true,
        ).length;
        const pendingTasks = tasks.length - completedTasks;

        // Extract deadlines for fallback
        const pendingDeadlines = [];
        tasks.forEach((task) => {
          if (task.status !== "done" && !task.completed) {
            pendingDeadlines.push({
              title: task.title || "Untitled Task",
              dueDate: task.dueDate,
              type: "Task",
            });
          }
        });

        const phases = course.phases || [];
        phases.forEach((phase) => {
          const requirements = phase.requirements || [];
          const hasIncomplete = requirements.some((r) => !r.completed);
          if (hasIncomplete) {
            pendingDeadlines.push({
              title: phase.title || "Project Phase",
              dueDate: phase.dueDate,
              type: "Phase",
            });
          }
        });

        const topDeadlines = pendingDeadlines.slice(0, 3);

        return {
          courseCode: course.code || "UNKNOWN",
          courseName: course.name || "Unknown Course",
          currentGradePercentage: course.currentPerformance || 0,
          completedTasks,
          pendingTasks,
          pendingDeadlines: topDeadlines,
        };
      });
      return generateFallbackRecommendations(coursesData);
    }
    return { recommendations: [] };
  }
};

/**
 * Fallback intelligent recommendations generator without Gemini (Deadline-Aware)
 */
const generateFallbackRecommendations = (coursesData) => {
  const recommendations = coursesData.map((course) => {
    const perf = course.currentGradePercentage || 0;
    const deadline = course.pendingDeadlines && course.pendingDeadlines[0];
    let status = "green";
    let summaryAdvice = "";
    let detailedAnalysis = "";

    // Determine status based on performance
    if (perf >= 80) {
      status = "green";
    } else if (perf >= 60) {
      status = "yellow";
    } else {
      status = "red";
    }

    // Calculate what-if scenario
    const remainingWeight = Math.max(0, 100 - perf); // Simplified: assume current grade represents work done
    const neededForA = perf >= 90 ? 0 : Math.ceil((90 - perf * 0.6) / 0.4); // Simple calculation
    const neededToPass = perf >= 60 ? 0 : Math.ceil((60 - perf * 0.6) / 0.4);

    // Cap needed percentages at 100% (max achievable). Calculate realistic best-case scenario.
    const neededToPassCapped = Math.min(neededToPass, 100);
    const maxPossibleGrade = Math.ceil(perf * 0.6 + 100 * 0.4); // If student gets perfect (100%) on all remaining work

    // Generate summaryAdvice (max 12 words) and detailedAnalysis
    if (deadline && deadline.dueDate) {
      const dueDate = new Date(deadline.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
      dueDate.setHours(0, 0, 0, 0);

      const isOverdue = dueDate < today;
      const dateStr = dueDate.toLocaleDateString();

      if (perf >= 85) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. '${deadline.title}' ${deadline.type} ${isOverdue ? "OVERDUE" : `due ${dateStr}`}.`;
        detailedAnalysis = `You're at ${Math.round(perf)}% with '${deadline.title}' (${deadline.type}) ${isOverdue ? `OVERDUE since ${dateStr}` : `due ${dateStr}`}. ${isOverdue ? "Submit this immediately as late submissions may lose points." : perf >= 90 ? "To keep your A grade (90%+), score 85%+ on remaining work." : "To reach an A grade (90%+), you need to score at least 90% on remaining assessments."} Your current performance is strong. Complete this ${deadline.type.toLowerCase()} ${isOverdue ? "now" : "on time"} to protect your grade.`;
      } else if (perf >= 75) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. '${deadline.title}' ${deadline.type} ${isOverdue ? "OVERDUE!" : `due ${dateStr}`}`;
        detailedAnalysis = `You're at ${Math.round(perf)}% with '${deadline.title}' (${deadline.type}) ${isOverdue ? `OVERDUE since ${dateStr}` : `due ${dateStr}`}. ${isOverdue ? "URGENT: Submit immediately to minimize grade penalty." : `To reach an A grade (90%+), you need approximately ${neededForA}% on remaining work.`} Focus on completing this ${deadline.type.toLowerCase()} to improve your standing and boost your final grade.`;
      } else if (perf >= 60) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. '${deadline.title}' ${deadline.type} ${isOverdue ? "OVERDUE!" : `due ${dateStr}`}`;
        detailedAnalysis = `You're at ${Math.round(perf)}% with '${deadline.title}' (${deadline.type}) ${isOverdue ? `OVERDUE since ${dateStr}` : `due ${dateStr}`}. CRITICAL: ${isOverdue ? "This is late. Submit NOW to avoid further penalties." : "To avoid falling below passing (60%), you must score at least 70% on all remaining work."} Complete this ${deadline.type.toLowerCase()} ${isOverdue ? "immediately" : "on time"} and seek instructor help if struggling with concepts.`;
      } else {
        summaryAdvice = `At-risk (${Math.round(perf)}%). '${deadline.title}' ${deadline.type} ${isOverdue ? "OVERDUE!" : `due ${dateStr}`}`;
        const passRecoveryMessage =
          neededToPass > 100
            ? `Even scoring 100% on all remaining work, you'd reach around ${maxPossibleGrade}% as Final Grade.`
            : `To pass this course (60%), you need ${neededToPassCapped}%+ on ALL remaining work.`;
        detailedAnalysis = `CRITICAL: You're at ${Math.round(perf)}% with '${deadline.title}' (${deadline.type}) ${isOverdue ? `OVERDUE since ${dateStr}` : `due ${dateStr}`}. ${passRecoveryMessage} ${isOverdue ? "This late submission will hurt your grade further." : "Historical data shows recovery from this position requires immediate action."} Complete '${deadline.title}' and contact your instructor for a recovery plan.`;
      }
    } else if (deadline) {
      summaryAdvice = `Grade: ${Math.round(perf)}%. Focus on '${deadline.title}' ${deadline.type}.`;
      detailedAnalysis = `You're at ${Math.round(perf)}% with upcoming ${deadline.type}: '${deadline.title}'. ${perf >= 90 ? "To keep your A grade (90%+), maintain 85%+ on remaining work." : perf >= 85 ? "To reach an A grade (90%+), aim for 90%+ on remaining assessments." : perf >= 60 ? `To reach an A grade (90%+), you need ${neededForA}% on remaining assessments.` : neededToPass > 100 ? `Even scoring 100% on all remaining work, you'd reach around ${maxPossibleGrade}% as Final Grade.` : `To pass (60%), you need ${neededToPassCapped}%+ on all work.`} Prioritize this ${deadline.type.toLowerCase()} to protect your grade.`;
    } else {
      // No deadlines
      if (perf >= 85) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. Maintain strong performance.`;
        detailedAnalysis = `Excellent work! You're at ${Math.round(perf)}%. ${perf >= 90 ? "To keep your A grade (90%+), continue scoring 85%+ on remaining assessments." : "To reach an A grade (90%+), aim for 90%+ on remaining work."} Your performance is on track—maintain this consistency through the semester.`;
      } else if (perf >= 75) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. Push toward 85%+.`;
        detailedAnalysis = `You're at ${Math.round(perf)}%. To reach an A grade (90%+), you need approximately ${neededForA}% on remaining work. Focus on upcoming assessments and review challenging concepts to boost your performance.`;
      } else if (perf >= 60) {
        summaryAdvice = `Grade: ${Math.round(perf)}%. Review concepts, seek help.`;
        detailedAnalysis = `You're at ${Math.round(perf)}%, in the yellow zone. To avoid falling below passing (60%), you must score 70%+ on all remaining work. Schedule office hours, form study groups, and tackle weak areas immediately.`;
      } else {
        summaryAdvice = `At-risk (${Math.round(perf)}%). Contact instructor NOW.`;
        const recoveryMessage =
          neededToPass > 100
            ? `Even scoring 100% on all remaining work, you'd reach around ${maxPossibleGrade}% as Final Grade. Contact your instructor TODAY—recovery requires special arrangements or extra credit.`
            : `To pass (60%), you need ${neededToPassCapped}%+ on remaining work. Contact your instructor TODAY for a personalized recovery plan.`;
        detailedAnalysis = `CRITICAL: You're at ${Math.round(perf)}%. ${recoveryMessage} Seek tutoring assistance immediately.`;
      }
    }

    return {
      courseCode: course.courseCode,
      courseName: course.courseName,
      status,
      summaryAdvice,
      detailedAnalysis,
    };
  });

  return { recommendations };
};

const buildSummaryModeInstructions = (mode) => {
  switch (mode) {
    case "custom":
      return "Use a balanced style and prioritize explicit user options for language, length, and focus over preset behavior.";
    case "exam":
      return "Prioritize exam-relevant concepts, common traps, likely comparisons, worked reasoning, and what an instructor is most likely to test.";
    case "action":
      return "Prioritize concrete action items, what to study first, what to practice next, and the fastest path to understanding.";
    case "detailed":
      return "Provide comprehensive coverage with deeper context, how topics connect, and strong study guidance.";
    case "quick":
    default:
      return "Keep it concise but still useful: explain what it means, not just what words appear.";
  }
};

const buildSummaryModeOutputRules = (mode) => {
  switch (mode) {
    case "custom":
      return {
        summaryStyle:
          "Frame the summary with balanced depth and adapt to the selected custom options.",
        focusRules: [
          "follow user-selected focus as the main emphasis",
          "adjust detail level based on user-selected length",
          "keep output practical and study-oriented",
        ],
        limits: {
          learningOutcomes: 5,
          conceptConnections: 4,
          examFocus: 4,
          importantTerms: 7,
          studyPlan: 5,
          possibleQuestions: 4,
          actionItems: 5,
        },
      };
    case "exam":
      return {
        summaryStyle:
          "Frame the summary like exam revision notes. Emphasize what is most testable and what students often miss.",
        focusRules: [
          "examFocus should be the strongest section and highly specific",
          "possibleQuestions should sound like actual instructor-style prompts",
          "studyPlan should read like a revision plan for an upcoming test",
          "actionItems should be immediate revision tasks",
        ],
        limits: {
          learningOutcomes: 4,
          conceptConnections: 3,
          examFocus: 5,
          importantTerms: 6,
          studyPlan: 5,
          possibleQuestions: 5,
          actionItems: 4,
        },
      };
    case "action":
      return {
        summaryStyle:
          "Frame the summary like a practical study coach. Focus on what to do next, what to practice first, and how to turn this into action.",
        focusRules: [
          "actionItems should be the strongest section and ordered by priority",
          "studyPlan should be concrete and sequential",
          "examFocus should be short and limited to immediate weak spots",
          "possibleQuestions should be practice-oriented rather than theoretical",
        ],
        limits: {
          learningOutcomes: 3,
          conceptConnections: 2,
          examFocus: 3,
          importantTerms: 5,
          studyPlan: 6,
          possibleQuestions: 3,
          actionItems: 6,
        },
      };
    case "detailed":
      return {
        summaryStyle:
          "Frame the summary like a strong tutor note. Add depth, relationships, and more complete reasoning.",
        focusRules: [
          "learningOutcomes and conceptConnections should be rich and complete",
          "summary should synthesize the big picture, not just list topics",
          "studyPlan should support multi-step learning",
        ],
        limits: {
          learningOutcomes: 6,
          conceptConnections: 5,
          examFocus: 4,
          importantTerms: 8,
          studyPlan: 6,
          possibleQuestions: 5,
          actionItems: 5,
        },
      };
    case "quick":
    default:
      return {
        summaryStyle:
          "Frame the summary like a fast, high-value overview for someone reviewing in under two minutes.",
        focusRules: [
          "keep every section short and high-signal",
          "avoid depth unless it adds immediate value",
          "surface only the most essential outcomes and terms",
        ],
        limits: {
          learningOutcomes: 3,
          conceptConnections: 2,
          examFocus: 2,
          importantTerms: 4,
          studyPlan: 3,
          possibleQuestions: 2,
          actionItems: 3,
        },
      };
  }
};

const normalizeSummaryOptions = (options = {}) => {
  const allowedLanguages = ["en", "ar"];
  const allowedLengths = ["short", "medium", "long"];
  const allowedFocuses = ["general", "exam", "action", "detailed", "quick"];

  const language = String(options.language || "en")
    .trim()
    .toLowerCase();
  const length = String(options.length || "medium")
    .trim()
    .toLowerCase();
  const focus = String(options.focus || "general")
    .trim()
    .toLowerCase();

  return {
    language: allowedLanguages.includes(language) ? language : "en",
    length: allowedLengths.includes(length) ? length : "medium",
    focus: allowedFocuses.includes(focus) ? focus : "general",
  };
};

const buildSummaryOptionInstructions = (mode, options) => {
  const normalizedOptions = normalizeSummaryOptions(options);
  const modeLengthDefaults = {
    quick: "short",
    detailed: "long",
    exam: "medium",
    action: "short",
  };

  const lines = [];

  if (normalizedOptions.language === "ar") {
    lines.push(
      "Output language must be Arabic (العربية) for all text fields. Do not return English sentences.",
    );
  } else {
    lines.push("Output language must be English.");
  }

  if (normalizedOptions.length !== modeLengthDefaults[mode]) {
    if (normalizedOptions.length === "short") {
      lines.push("Keep responses short and high-signal.");
    } else if (normalizedOptions.length === "long") {
      lines.push("Provide longer answers with deeper explanations.");
    } else {
      lines.push("Use medium length with balanced detail.");
    }
  }

  if (
    normalizedOptions.focus !== "general" &&
    normalizedOptions.focus !== mode
  ) {
    lines.push(`Additional focus preference: ${normalizedOptions.focus}.`);
  }

  return {
    normalizedOptions,
    instructionText: lines.join(" "),
  };
};

const trimArray = (value, maxItems) => {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).slice(0, maxItems);
};

const SUMMARY_TEXT_FIELDS = [
  "summary",
  "plainLanguageSummary",
  "learningOutcomes",
  "conceptConnections",
  "examFocus",
  "importantTerms",
  "studyPlan",
  "possibleQuestions",
  "actionItems",
];

const flattenSummaryText = (summary = {}) => {
  return SUMMARY_TEXT_FIELDS.flatMap((field) => {
    const value = summary[field];
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string");
    }
    if (typeof value === "string") {
      return [value];
    }
    return [];
  }).join(" ");
};

const getArabicCoverage = (text = "") => {
  const letters = text.match(/[A-Za-z\u0600-\u06FF]/g) || [];
  if (letters.length === 0) return 0;
  const arabicLetters = text.match(/[\u0600-\u06FF]/g) || [];
  return arabicLetters.length / letters.length;
};

const isMostlyArabicSummary = (summary) => {
  const combined = flattenSummaryText(summary);
  return getArabicCoverage(combined) >= 0.4;
};

const translateSummaryToArabic = async (summary) => {
  const prompt = `Translate the following UniMate summary JSON to Arabic.

Rules:
- Return strictly valid JSON.
- Keep exactly the same keys and structure.
- Keep numbers, formulas, and technical terms accurate.
- Every sentence in every field must be Arabic.

Input JSON:
${JSON.stringify(summary)}`;

  const translated = await callLLMWithRetry(prompt, SummarySchema, 2);
  return translated && typeof translated === "object" ? translated : summary;
};

const enforceSummaryLanguage = async (summary, options = {}) => {
  const normalizedOptions = normalizeSummaryOptions(options);

  if (normalizedOptions.language !== "ar") {
    return summary;
  }

  if (isMostlyArabicSummary(summary)) {
    return summary;
  }

  try {
    return await translateSummaryToArabic(summary);
  } catch (error) {
    console.error("Arabic translation enforcement failed:", error.message);
    return summary;
  }
};

const shapeSummaryByMode = (summary, mode) => {
  const modeRules = buildSummaryModeOutputRules(mode);

  return {
    ...summary,
    learningOutcomes: trimArray(
      summary.learningOutcomes,
      modeRules.limits.learningOutcomes,
    ),
    conceptConnections: trimArray(
      summary.conceptConnections,
      modeRules.limits.conceptConnections,
    ),
    examFocus: trimArray(summary.examFocus, modeRules.limits.examFocus),
    importantTerms: trimArray(
      summary.importantTerms,
      modeRules.limits.importantTerms,
    ),
    studyPlan: trimArray(summary.studyPlan, modeRules.limits.studyPlan),
    possibleQuestions: trimArray(
      summary.possibleQuestions,
      modeRules.limits.possibleQuestions,
    ),
    actionItems: trimArray(summary.actionItems, modeRules.limits.actionItems),
  };
};

const extractConceptCandidates = (content) => {
  return (content || "")
    .split(/\n|,|;|\.|\||\/|:/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.length > 2)
    .slice(0, 10);
};

const toTitleCase = (value) => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const generateFallbackSummary = (content, mode, language = "en") => {
  const useArabic = String(language || "en").toLowerCase() === "ar";
  const normalized = (content || "").replace(/\s+/g, " ").trim();

  if (useArabic) {
    const conceptCandidates = extractConceptCandidates(normalized);
    const concepts =
      conceptCandidates.length > 0
        ? conceptCandidates.slice(0, 6)
        : ["المفاهيم الأساسية", "العناصر الرئيسية", "التطبيقات العملية"];

    const summary = `يتناول هذا المحتوى بشكل أساسي: ${concepts.join("، ")}. يركز الملخص على الفهم السريع وربط النقاط المهمة للدراسة.`;

    const learningOutcomes = concepts
      .slice(0, 5)
      .map((item) => `شرح مفهوم ${item} وتوضيح دوره ضمن الموضوع.`);

    const examFocus = concepts
      .slice(0, 4)
      .map(
        (item) => `التركيز على أسئلة المقارنة والتطبيق المتعلقة بـ ${item}.`,
      );

    const possibleQuestions = concepts
      .slice(0, 4)
      .map((item) => `كيف تشرح ${item} مع مثال عملي؟`);

    const studyPlan = [
      "اقرأ الملخص أولًا لفهم الصورة العامة.",
      "راجع المصطلحات والمفاهيم الأساسية بترتيب منطقي.",
      mode === "exam"
        ? "تدرّب على أسئلة اختبار قصيرة من الذاكرة."
        : "اربط كل مفهوم بتطبيق عملي أو مثال واقعي.",
    ];

    const actionItems = [
      "اكتب الفكرة الرئيسية بأسلوبك الخاص في جملة واحدة.",
      "حدّد أصعب مفهوم لديك وأعد قراءته مع مثال.",
      "اكتب 2–3 أسئلة تدريبية من أكثر النقاط أهمية.",
      "راجع الملخص مرة أخرى خلال 24 ساعة لتثبيت الفهم.",
    ];

    return shapeSummaryByMode(
      {
        summary,
        plainLanguageSummary: summary,
        learningOutcomes,
        conceptConnections: [],
        examFocus,
        importantTerms: concepts,
        studyPlan,
        possibleQuestions,
        actionItems,
      },
      mode,
    );
  }

  // Extract real sentences from the document
  const allSentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 350 && /[a-zA-Z]{3,}/.test(s));

  // Score sentences by information density — prefer sentences with actual facts
  const skipPattern =
    /^(this (lecture|course|chapter|slide|week)|we (will|are going to|cover)|in this|by the end|learning objective|agenda|outline|slide \d)/i;
  const boostPattern =
    /(\d+%?|\bis\b|\bare\b|\bmeans\b|\bdefined\b|\bcalled\b|\brefers\b|\bsuch as\b|\bfor example\b|\benables\b|\ballows\b|\bconsists\b|\bincludes\b)/i;

  const scoreSentence = (s, idx) => {
    let score = 0;
    if (skipPattern.test(s)) score -= 5;
    if (boostPattern.test(s)) score += 3;
    if (/\d/.test(s)) score += 2;
    if (s.length > 80) score += 1;
    score -= idx * 0.02; // slight early-position bonus
    return score;
  };

  const ranked = allSentences
    .map((s, i) => ({ s, score: scoreSentence(s, i) }))
    .sort((a, b) => b.score - a.score)
    .map(({ s }) => s);

  // Build summary prose from top-ranked sentences
  const summaryCount = mode === "detailed" ? 20 : mode === "exam" ? 4 : 3;
  const topSentences = ranked.slice(0, summaryCount);
  const fallbackToFirst = allSentences.slice(0, summaryCount);
  const summaryPool = topSentences.length >= 2 ? topSentences : fallbackToFirst;

  // For detailed mode, restore original document order for natural reading flow
  const orderedPool =
    mode === "detailed"
      ? allSentences.filter((s) => summaryPool.includes(s))
      : summaryPool;

  const summary =
    orderedPool.join(" ") ||
    "No sufficient text was provided to generate a summary.";

  // For quick mode: pull 3 additional real sentences as "key takeaways"
  const takeawaySentences = ranked
    .filter((s) => !orderedPool.includes(s))
    .slice(0, 5);

  const learningOutcomes =
    takeawaySentences.length >= 2
      ? takeawaySentences.slice(0, mode === "quick" ? 3 : 5)
      : allSentences.filter((s) => !orderedPool.includes(s)).slice(0, 3);

  // Extract definition-style or fact sentences for exam focus
  const factSentences = allSentences.filter((s) =>
    /(\bis\b|\bare\b|\bmeans\b|\bdefined as\b|\bcalled\b|\bprocess of\b|\btype of\b|\bsuch as\b|\bfor example\b)/i.test(
      s,
    ),
  );
  const examFocus =
    factSentences.length >= 2
      ? factSentences.slice(0, 4)
      : ranked.filter((s) => !summaryPool.includes(s)).slice(0, 3);

  // Build possible questions from actual content sentences
  const questionSeeds = [...factSentences, ...takeawaySentences]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 4);

  const possibleQuestions =
    questionSeeds.length >= 2
      ? questionSeeds.map((s) => {
          const stripped = s.replace(/\.$/, "");
          // Convert statement to question form
          if (/\bis\b|\bare\b/.test(s))
            return `What ${stripped
              .split(/\bis\b|\bare\b/)[0]
              .trim()
              .toLowerCase()} is described here, and what makes it significant?`;
          return `Based on the text, explain: "${stripped.length > 80 ? stripped.slice(0, 80) + "…" : stripped}"`;
        })
      : [
          "What are the key concepts introduced in this material?",
          "How do the main ideas in this content connect to each other?",
          "What would you need to explain to someone studying this topic for the first time?",
        ];

  const studyPlan = [
    "Read through the material once without stopping to get the big picture.",
    "Identify the 3–5 most important points and write them in your own words.",
    "Look up any terms or concepts that were unclear on first reading.",
    mode === "exam"
      ? "Simulate a short exam: write answers to the possible questions from memory."
      : "Review how each key point connects to the others.",
  ];

  const actionItems = [
    "Rewrite the main idea in one sentence without looking at the text.",
    "Choose the concept you understood least and re-read that section.",
    "Create 2–3 practice questions from the most testable content.",
    "Review this summary again 24 hours later to check recall.",
  ];

  return shapeSummaryByMode(
    {
      summary,
      plainLanguageSummary: summary,
      learningOutcomes,
      conceptConnections: [],
      examFocus,
      importantTerms: [],
      studyPlan,
      possibleQuestions,
      actionItems,
    },
    mode,
  );
};

const generateStructuredSummary = async ({
  content,
  mode = "quick",
  courseContext = null,
  options = {},
}) => {
  try {
    const trimmed = (content || "").trim();
    const normalizedOptions = normalizeSummaryOptions(options);

    if (!trimmed) {
      return generateFallbackSummary(content, mode, normalizedOptions.language);
    }

    const hasGeminiKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0;

    if (!hasGeminiKey || !model) {
      return generateFallbackSummary(trimmed, mode, normalizedOptions.language);
    }

    const modeInstructions = buildSummaryModeInstructions(mode);
    const modeOutputRules = buildSummaryModeOutputRules(mode);
    const { instructionText } = buildSummaryOptionInstructions(
      mode,
      normalizedOptions,
    );
    const contextLine = courseContext
      ? `Course context: ${courseContext.code || "N/A"} - ${courseContext.name || "N/A"}`
      : "Course context: Not provided";

    const prompt = `You are an academic study assistant. Create a structured study summary from the provided content.

Summary mode: ${mode}
Mode guidance: ${modeInstructions}
Mode output style: ${modeOutputRules.summaryStyle}
Mode-specific rules:
- ${modeOutputRules.focusRules.join("\n- ")}
Option guidance: ${instructionText}
${contextLine}

SOURCE CONTENT:
${trimmed}

Return valid JSON with these fields only:
- summary: 2-4 sentences that synthesize the material instead of repeating it.
- plainLanguageSummary: explain in simpler words what this content is really about and why it matters.
- learningOutcomes: 4-6 bullets starting with verbs like explain, compare, apply, analyze.
- conceptConnections: 3-5 bullets showing how the major topics fit together or build on each other.
- examFocus: 3-5 bullets about what an instructor is most likely to test or where students usually struggle.
- importantTerms: 5-10 terms.
- studyPlan: 3-6 ordered steps.
- possibleQuestions: 3-6 likely quiz/exam questions.
- actionItems: 3-6 concrete actions.

Constraints:
- Keep language concise and student-friendly.
- Respect language, length, and focus options while avoiding duplicate instructions already implied by the selected mode.
- If language is Arabic, every returned sentence in every field must be Arabic.
- Avoid markdown.
- Avoid generic filler.
- Do not just copy the outline back.
- Infer the teaching logic if the source looks like a comma-separated outline.
- Focus on usefulness for studying and exam prep.`;

    const result = await callLLMWithRetry(prompt, SummarySchema);

    if (!result || typeof result !== "object") {
      const fallbackOnly = generateFallbackSummary(
        trimmed,
        mode,
        normalizedOptions.language,
      );
      return await enforceSummaryLanguage(fallbackOnly, normalizedOptions);
    }

    const fallback = generateFallbackSummary(
      trimmed,
      mode,
      normalizedOptions.language,
    );
    const mergedSummary = shapeSummaryByMode(
      {
        summary: result.summary || fallback.summary,
        plainLanguageSummary:
          result.plainLanguageSummary || fallback.plainLanguageSummary,
        learningOutcomes: Array.isArray(result.learningOutcomes)
          ? result.learningOutcomes
          : fallback.learningOutcomes,
        conceptConnections: Array.isArray(result.conceptConnections)
          ? result.conceptConnections
          : fallback.conceptConnections,
        examFocus: Array.isArray(result.examFocus)
          ? result.examFocus
          : fallback.examFocus,
        importantTerms: Array.isArray(result.importantTerms)
          ? result.importantTerms
          : fallback.importantTerms,
        studyPlan: Array.isArray(result.studyPlan)
          ? result.studyPlan
          : fallback.studyPlan,
        possibleQuestions: Array.isArray(result.possibleQuestions)
          ? result.possibleQuestions
          : fallback.possibleQuestions,
        actionItems: Array.isArray(result.actionItems)
          ? result.actionItems
          : fallback.actionItems,
      },
      mode,
    );

    return await enforceSummaryLanguage(mergedSummary, normalizedOptions);
  } catch (error) {
    console.error("Failed to generate structured summary:", error.message);
    const normalizedOptions = normalizeSummaryOptions(options);
    const fallbackOnly = generateFallbackSummary(
      content,
      mode,
      normalizedOptions.language,
    );
    return await enforceSummaryLanguage(fallbackOnly, options);
  }
};

module.exports = {
  calculateAIPrediction,
  generateActionableRecommendations,
  generateStructuredSummary,
};
