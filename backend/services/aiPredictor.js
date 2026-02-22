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

module.exports = {
  calculateAIPrediction,
};
