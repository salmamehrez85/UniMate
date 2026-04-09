const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { protect } = require("../middleware/auth");
const ChatSession = require("../model/ChatSession");

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

// Generate a short title from the first user message using Gemini
async function generateTitle(firstUserMessage, genAI) {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
    const result = await model.generateContent(
      `Generate a short (max 6 words) chat title for this message. Return ONLY the title, no punctuation, no quotes:\n\n"${firstUserMessage.slice(0, 200)}"`,
    );
    return result.response.text().trim().slice(0, 100);
  } catch {
    return firstUserMessage.slice(0, 60);
  }
}

// GET /api/chat/sessions — list all sessions for the user
router.get("/sessions", protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select("_id title createdAt updatedAt")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error("[Chat Sessions List Error]", error);
    return res.status(500).json({ error: "Failed to fetch chat sessions" });
  }
});

// GET /api/chat/sessions/:id — load a single session with messages
router.get("/sessions/:id", protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.status(200).json({ session });
  } catch (error) {
    console.error("[Chat Session Load Error]", error);
    return res.status(500).json({ error: "Failed to load chat session" });
  }
});

// DELETE /api/chat/sessions/:id — delete a session
router.delete("/sessions/:id", protect, async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Chat Session Delete Error]", error);
    return res.status(500).json({ error: "Failed to delete chat session" });
  }
});

// PATCH /api/chat/sessions/:id — rename a session
router.patch("/sessions/:id", protect, async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  try {
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: title.trim().slice(0, 100) },
      { new: true },
    );
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.status(200).json({ session });
  } catch (error) {
    console.error("[Chat Session Rename Error]", error);
    return res.status(500).json({ error: "Failed to rename chat session" });
  }
});

// POST /api/chat/message — send a message; creates or updates a session
router.post("/message", protect, async (req, res) => {
  const { messages, sessionId } = req.body;

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

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const responseText = result.response.text();

    // Persist to DB
    const allMessages = [
      ...messages,
      { role: "assistant", content: responseText },
    ];

    let session;
    if (sessionId) {
      session = await ChatSession.findOneAndUpdate(
        { _id: sessionId, user: req.user._id },
        { messages: allMessages, updatedAt: new Date() },
        { new: true },
      );
    }

    if (!session) {
      // New session — generate a title from the first user message
      const firstUserMsg =
        messages.find((m) => m.role === "user")?.content || "New Chat";
      const title = await generateTitle(firstUserMsg, genAI);
      session = await ChatSession.create({
        user: req.user._id,
        title,
        messages: allMessages,
      });
    }

    return res.status(200).json({
      reply: responseText,
      sessionId: session._id,
      title: session.title,
    });
  } catch (error) {
    console.error("[Chat Error]", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;
