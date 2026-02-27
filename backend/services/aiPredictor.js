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

    if (!result) {
      // Return empty ranking if LLM fails
      return { ranked_past_courses: [] };
    }

    return result;
  } catch (error) {
    console.error("Failed to find similar courses:", error.message);
    return { ranked_past_courses: [] };
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
    const currentAvg = activeCourse.current_performance || 70;

    // 1. Generate profile for active course
    const activeProfile = await generateCourseProfile(
      activeCourse.name,
      activeCourse.outline_text || activeCourse.name,
    );

    const targetObj = {
      id: activeCourse.code,
      name: activeCourse.name,
      profile: activeProfile,
    };

    // 2. Generate profiles for all past courses
    const historyObjs = [];
    const pastDataMap = {};

    for (const past of pastCourses) {
      const pCode = past.code;

      pastDataMap[pCode] = {
        quiz_avg: past.current_performance || past.final_grade || 70,
        final_pct: past.final_grade || 70,
      };

      const pProfile = await generateCourseProfile(
        past.name,
        past.outline_text || past.name,
      );

      historyObjs.push({
        id: pCode,
        name: past.name,
        profile: pProfile,
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

    return {
      predicted_score_pct: Math.round(predPct * 100) / 100,
      confidence,
      similar_courses: similarCoursesOutput,
    };
  } catch (error) {
    console.error("AI Prediction calculation error:", error);

    // Return fallback prediction with error flag
    return {
      predicted_score_pct: activeCourse.current_performance || 70,
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
        detailedAnalysis = `CRITICAL: You're at ${Math.round(perf)}% with '${deadline.title}' (${deadline.type}) ${isOverdue ? `OVERDUE since ${dateStr}` : `due ${dateStr}`}. To pass this course (60%), you need ${neededToPass}%+ on ALL remaining work. ${isOverdue ? "This late submission will hurt your grade further." : "Historical data shows recovery from this position requires immediate action."} Complete '${deadline.title}' and contact your instructor for a recovery plan.`;
      }
    } else if (deadline) {
      summaryAdvice = `Grade: ${Math.round(perf)}%. Focus on '${deadline.title}' ${deadline.type}.`;
      detailedAnalysis = `You're at ${Math.round(perf)}% with upcoming ${deadline.type}: '${deadline.title}'. ${perf >= 90 ? "To keep your A grade (90%+), maintain 85%+ on remaining work." : perf >= 85 ? "To reach an A grade (90%+), aim for 90%+ on remaining assessments." : perf >= 60 ? `To reach an A grade (90%+), you need ${neededForA}% on remaining assessments.` : `To pass (60%), you need ${neededToPass}%+ on all work.`} Prioritize this ${deadline.type.toLowerCase()} to protect your grade.`;
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
            ? `Even scoring 100% on all remaining work, you'd reach ~${maxPossibleGrade}%. Contact your instructor TODAY—recovery requires special arrangements or extra credit.`
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

module.exports = {
  calculateAIPrediction,
  generateActionableRecommendations,
};
