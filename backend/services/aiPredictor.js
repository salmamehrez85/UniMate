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
      description: "A concise 2-4 sentence summary tailored to the mode",
    },
    keyPoints: {
      type: "array",
      items: { type: "string" },
      description: "4-8 key points from the source content",
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
    "keyPoints",
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
    case "exam":
      return "Prioritize exam-relevant concepts, definitions, contrasts, and likely test points.";
    case "action":
      return "Prioritize concrete action items, deadlines, and immediate next steps.";
    case "detailed":
      return "Provide comprehensive coverage with deeper context and structured study guidance.";
    case "quick":
    default:
      return "Keep it concise and practical for fast review.";
  }
};

const generateFallbackSummary = (content, mode) => {
  const normalized = (content || "").replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const summary =
    sentences.slice(0, 3).join(" ") ||
    "No sufficient text was provided to generate a meaningful summary.";

  const keyPoints = sentences.slice(0, 6).map((sentence) => {
    if (sentence.length > 160) {
      return `${sentence.slice(0, 157)}...`;
    }
    return sentence;
  });

  const words = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5);

  const stopWords = new Set([
    "about",
    "there",
    "their",
    "these",
    "those",
    "which",
    "while",
    "where",
    "would",
    "could",
    "should",
    "because",
    "through",
    "between",
    "before",
    "after",
    "under",
    "above",
    "other",
    "being",
    "using",
    "study",
    "course",
    "student",
  ]);

  const frequency = new Map();
  words.forEach((word) => {
    if (!stopWords.has(word)) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
  });

  const importantTerms = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  const basePlan = [
    "Read the full summary once for context.",
    "Review key points and rewrite them in your own words.",
    "Focus on important terms and verify each concept.",
    "Answer the possible questions without notes.",
  ];

  const modeSpecificStep =
    mode === "exam"
      ? "Simulate a timed exam review on these concepts."
      : mode === "action"
        ? "Convert action items into scheduled tasks in your planner."
        : mode === "detailed"
          ? "Expand each key point into 3-5 supporting details."
          : "Do a 10-minute quick recall session at the end.";

  const studyPlan = [...basePlan, modeSpecificStep];

  const possibleQuestions = keyPoints.slice(0, 5).map((point, index) => {
    const compact = point.length > 90 ? `${point.slice(0, 87)}...` : point;
    return `Q${index + 1}: Explain this concept and give one example: ${compact}`;
  });

  const actionItems = [
    "Identify one weak topic from the key points.",
    "Create short notes for the top important terms.",
    "Solve at least 3 practice questions related to this topic.",
    "Review progress and adjust your next study session.",
  ];

  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : ["No key points extracted."],
    importantTerms:
      importantTerms.length > 0
        ? importantTerms
        : ["No important terms identified."],
    studyPlan,
    possibleQuestions:
      possibleQuestions.length > 0
        ? possibleQuestions
        : ["What are the most important ideas in this content?"],
    actionItems,
  };
};

const generateStructuredSummary = async ({
  content,
  mode = "quick",
  courseContext = null,
}) => {
  try {
    const trimmed = (content || "").trim();

    if (!trimmed) {
      return generateFallbackSummary(content, mode);
    }

    const hasGeminiKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0;

    if (!hasGeminiKey || !model) {
      return generateFallbackSummary(trimmed, mode);
    }

    const modeInstructions = buildSummaryModeInstructions(mode);
    const contextLine = courseContext
      ? `Course context: ${courseContext.code || "N/A"} - ${courseContext.name || "N/A"}`
      : "Course context: Not provided";

    const prompt = `You are an academic study assistant. Create a structured study summary from the provided content.

Summary mode: ${mode}
Mode guidance: ${modeInstructions}
${contextLine}

SOURCE CONTENT:
${trimmed}

Return valid JSON with these fields only:
- summary: 2-4 clear sentences.
- keyPoints: 4-8 bullets (short and specific).
- importantTerms: 5-10 terms.
- studyPlan: 3-6 ordered steps.
- possibleQuestions: 3-6 likely quiz/exam questions.
- actionItems: 3-6 concrete actions.

Constraints:
- Keep language concise and student-friendly.
- Avoid markdown.
- Avoid generic filler.
- Keep each item under 20 words when possible.`;

    const result = await callLLMWithRetry(prompt, SummarySchema);

    if (!result || typeof result !== "object") {
      return generateFallbackSummary(trimmed, mode);
    }

    return {
      summary: result.summary || generateFallbackSummary(trimmed, mode).summary,
      keyPoints: Array.isArray(result.keyPoints)
        ? result.keyPoints
        : generateFallbackSummary(trimmed, mode).keyPoints,
      importantTerms: Array.isArray(result.importantTerms)
        ? result.importantTerms
        : generateFallbackSummary(trimmed, mode).importantTerms,
      studyPlan: Array.isArray(result.studyPlan)
        ? result.studyPlan
        : generateFallbackSummary(trimmed, mode).studyPlan,
      possibleQuestions: Array.isArray(result.possibleQuestions)
        ? result.possibleQuestions
        : generateFallbackSummary(trimmed, mode).possibleQuestions,
      actionItems: Array.isArray(result.actionItems)
        ? result.actionItems
        : generateFallbackSummary(trimmed, mode).actionItems,
    };
  } catch (error) {
    console.error("Failed to generate structured summary:", error.message);
    return generateFallbackSummary(content, mode);
  }
};

module.exports = {
  calculateAIPrediction,
  generateActionableRecommendations,
  generateStructuredSummary,
};
