const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/auth");

const router = express.Router();

const SYSTEM_PROMPT = `You are UniMate AI, a dedicated academic study assistant built into the UniMate student learning platform. Your role is to help university students with:

- Explaining concepts across all academic subjects (math, science, engineering, humanities, etc.)
- Summarizing and simplifying complex topics
- Helping with assignments, problem-solving, and exam preparation
- Providing study tips, strategies, and time management advice
- Answering questions about course material
- Helping students understand lecture notes and textbook content

Guidelines:
- Be clear, concise, and academically accurate
- Use examples and analogies when explaining difficult concepts
- Break down complex problems into manageable steps
- Encourage and motivate students
- Format responses with markdown when helpful (bullet points, numbered lists, bold for key terms, code blocks for code)
- If a question is outside your knowledge, say so honestly
- Maintain context across the conversation`;

router.post("/message", protect, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI service is not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini history format
    // All messages except the last one become history
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    return res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("[Chat Error]", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;
