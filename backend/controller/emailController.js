const { GoogleGenerativeAI } = require("@google/generative-ai");

const formalizeEmail = async (req, res) => {
  try {
    const {
      purpose,
      courseName,
      courseCode,
      professor,
      studentName,
      additionalContext,
    } = req.body;

    if (!additionalContext?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Additional context is required to formalize email",
      });
    }

    // Validate studentName is not a placeholder
    if (!studentName || studentName === "[Your Name]") {
      return res.status(400).json({
        success: false,
        error: "Student name is required to generate email",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured",
      });
    }

    if (!apiKey.startsWith("AIza")) {
      return res.status(500).json({
        success: false,
        error: "Invalid GEMINI_API_KEY format",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      process.env.GEMINI_MODEL,
      "gemini-2.5-flash",
    ].filter(Boolean);

    let lastError;

    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });

        const prompt = `Write a brief, formal email to a professor. Get straight to the point and keep the email body under 3-4 sentences. Avoid unnecessary filler or lengthy pleasantries.        
Please formalize the following email based on the context provided:

**Email Details:**
- Purpose: ${purpose}
- Course: ${courseName} (${courseCode})
- Professor: ${professor}
- Student Name: ${studentName}
- Additional Context: ${additionalContext}

Please write a professional, formal email that:
1. Addresses the professor respectfully
2. Clearly states the purpose
3. Incorporates the additional context naturally
4. Is polite, concise, and well-structured
5. Ends with a proper closing

Format the output as:
Subject: [subject line]

[email body]

Best regards,
${studentName}`;

        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        const formalizedEmail = response.response.text().trim();

        return res.status(200).json({
          success: true,
          formalizedEmail,
        });
      } catch (error) {
        console.error(`[${modelId}] Error:`, error.message);
        lastError = error;
      }
    }

    throw lastError || new Error("Failed to formalize email with Gemini");
  } catch (error) {
    console.error("Email formalization error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to formalize email",
    });
  }
};

module.exports = {
  formalizeEmail,
};
