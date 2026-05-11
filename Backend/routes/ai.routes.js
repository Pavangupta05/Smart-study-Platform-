const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getProvider } = require("../services/ai/ai.provider");

// ── POST /api/ai/chat ────────────────────────────────────────────────────────
// Full chat with context awareness
router.post("/chat", protect, async (req, res) => {
  const { messages = [], context = {} } = req.body;

  if (!messages.length) {
    return res.status(400).json({ success: false, message: "Messages array is required." });
  }

  try {
    const provider = getProvider();
    const text = await provider.chat(messages, context);
    res.json({ success: true, data: { text } });
  } catch (err) {
    console.error("AI Chat Error:", err.message);
    res.status(500).json({
      success: false,
      message: "AI service temporarily unavailable. Please try again.",
    });
  }
});

// ── POST /api/ai/chat/stream ─────────────────────────────────────────────────
// Streaming chat via SSE — for typewriter effect
router.post("/chat/stream", protect, async (req, res) => {
  const { messages = [], context = {} } = req.body;

  if (!messages.length) {
    return res.status(400).json({ success: false, message: "Messages required." });
  }

  try {
    const provider = getProvider();
    await provider.streamChat(messages, context, res);
  } catch (err) {
    console.error("AI Stream Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Streaming failed." });
    }
  }
});

// ── POST /api/ai/flashcards ──────────────────────────────────────────────────
// Generate flashcards for a topic
router.post("/flashcards", protect, async (req, res) => {
  const { topic, count = 10 } = req.body;

  if (!topic?.trim()) {
    return res.status(400).json({ success: false, message: "Topic is required." });
  }

  if (count < 1 || count > 30) {
    return res.status(400).json({ success: false, message: "Count must be between 1 and 30." });
  }

  try {
    const provider = getProvider();
    const cards = await provider.generateFlashcards(topic, count);
    res.json({ success: true, data: { cards } });
  } catch (err) {
    console.error("AI Flashcard Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate flashcards. Please try again.",
    });
  }
});

// ── POST /api/ai/optimize-schedule ──────────────────────────────────────────
// AI schedule optimization
router.post("/optimize-schedule", protect, async (req, res) => {
  const { tasks = [] } = req.body;

  if (!tasks.length) {
    return res.status(400).json({ success: false, message: "No tasks to optimize." });
  }

  try {
    const provider = getProvider();
    const result = await provider.optimizeSchedule(tasks);

    // Parse the structured response
    const tasksMatch = result.match(/TASKS:\s*(\[.*\])/s);
    const tipMatch = result.match(/TIP:\s*(.*)/);

    const optimizedTasks = tasksMatch ? JSON.parse(tasksMatch[1]) : [];
    const tip = tipMatch ? tipMatch[1].trim() : "";

    res.json({ success: true, data: { tasks: optimizedTasks, tip } });
  } catch (err) {
    console.error("AI Schedule Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to optimize schedule. Please try again.",
    });
  }
});

module.exports = router;
