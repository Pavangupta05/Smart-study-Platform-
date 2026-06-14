const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getProvider } = require("../services/ai/ai.provider");

let Note;
try { Note = require("../models/Note"); } catch (_) {}
let User;
try { User = require("../models/User"); } catch (_) {}
const { getMockMode } = require("../config/db");

// ── PLAN ENFORCEMENT MIDDLEWARE ──────────────────────────────────────────────
const enforceAILimit = async (req, res, next) => {
  if (getMockMode() || !User) return next();
  try {
    const user = await User.findById(req.userId);
    if (!user) return next();
    
    const limit = user.plan === "pro" ? Infinity : 10;
    const now = new Date();
    const resetDate = user.usageStats?.aiQueriesResetDate ? new Date(user.usageStats.aiQueriesResetDate) : null;
    let currentCount = user.usageStats?.aiQueriesThisMonth || 0;
    
    if (!resetDate || now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      currentCount = 0;
    }
    
    if (currentCount >= limit) {
      return res.status(403).json({ success: false, message: "Free plan limit reached. Please upgrade to Pro for unlimited AI." });
    }
    
    // Optimistically increment
    await User.findByIdAndUpdate(req.userId, {
      $inc: { "usageStats.aiQueriesThisMonth": 1 },
      "usageStats.aiQueriesResetDate": resetDate || now
    });
    next();
  } catch (err) {
    next(err);
  }
};

// ── POST /api/ai/chat ────────────────────────────────────────────────────────
// Full chat with context awareness + optional multi-doc context
router.post("/chat", protect, enforceAILimit, async (req, res) => {
  const { messages = [], context = {}, provider: reqProvider, contextNoteIds = [] } = req.body;

  if (!messages.length) {
    return res.status(400).json({ success: false, message: "Messages array is required." });
  }

  // Fetch multi-doc context notes and inject into context
  let enrichedContext = { ...context };
  if (contextNoteIds.length > 0 && Note) {
    try {
      const notes = await Note.find({ _id: { $in: contextNoteIds }, user: req.userId });
      const contextText = notes.map(n => {
        const text = [n.content, ...(n.pages || [])].filter(Boolean).join("\n");
        return `### [Source: ${n.name}]\n${text.substring(0, 3000)}`;
      }).join("\n\n---\n\n");
      if (contextText) {
        enrichedContext.multiDocContext = contextText;
        enrichedContext.contextNoteNames = notes.map(n => n.name);
      }
    } catch (err) {
      console.warn("Multi-doc context fetch error:", err.message);
    }
  }

  try {
    const provider = getProvider(reqProvider);
    const text = await provider.chat(messages, enrichedContext);
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
router.post("/chat/stream", protect, enforceAILimit, async (req, res) => {
  const { messages = [], context = {}, provider: reqProvider, file = null } = req.body;

  if (!messages.length) {
    return res.status(400).json({ success: false, message: "Messages required." });
  }

  try {
    const provider = getProvider(reqProvider);
    await provider.streamChat(messages, context, res, file);
  } catch (err) {
    console.error("AI Stream Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Streaming failed." });
    }
  }
});

// ── POST /api/ai/flashcards ──────────────────────────────────────────────────
// Generate flashcards for a topic
router.post("/flashcards", protect, enforceAILimit, async (req, res) => {
  const { topic, count = 10, provider: reqProvider } = req.body;

  if (!topic?.trim()) {
    return res.status(400).json({ success: false, message: "Topic is required." });
  }

  if (count < 1 || count > 30) {
    return res.status(400).json({ success: false, message: "Count must be between 1 and 30." });
  }

  try {
    const provider = getProvider(reqProvider);
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
router.post("/optimize-schedule", protect, enforceAILimit, async (req, res) => {
  const { tasks = [], provider: reqProvider } = req.body;

  if (!tasks.length) {
    return res.status(400).json({ success: false, message: "No tasks to optimize." });
  }

  try {
    const provider = getProvider(reqProvider);
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

// ── POST /api/ai/mindmap ─────────────────────────────────────────────────────
// Generate a JSON mind map from note content
router.post("/mindmap", protect, enforceAILimit, async (req, res) => {
  const { noteContent, provider: reqProvider } = req.body;
  if (!noteContent?.trim()) {
    return res.status(400).json({ success: false, message: "noteContent is required." });
  }
  try {
    const provider = getProvider(reqProvider);
    const prompt = `Analyze the following study content and extract the key concepts as a mind map.
Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "nodes": [{"id": "1", "label": "Main Topic", "type": "main"}, {"id": "2", "label": "Sub-concept", "type": "concept"}],
  "edges": [{"from": "1", "to": "2"}]
}
Types: "main" (1 only), "concept", "definition", "example"
Max 15 nodes. Make labels concise (1-5 words).

Content:
${noteContent.substring(0, 4000)}`;
    const rawText = await provider.chat([{ role: "user", text: prompt }], {});
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const graph = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: graph });
  } catch (err) {
    console.error("Mindmap error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate mind map." });
  }
});

// ── POST /api/ai/podcast ─────────────────────────────────────────────────────
// Generate a dialogue-style podcast script
router.post("/podcast", protect, enforceAILimit, async (req, res) => {
  const { topic, length = "short", provider: reqProvider } = req.body;
  if (!topic?.trim()) {
    return res.status(400).json({ success: false, message: "Topic is required." });
  }
  const wordTarget = length === "long" ? 600 : 300;
  try {
    const provider = getProvider(reqProvider);
    const prompt = `Create an engaging educational podcast script about: "${topic}".
Format as a dialogue between "Professor" and "Student". About ${wordTarget} words total.
Return ONLY a JSON array (no markdown):
[{"speaker": "Professor", "line": "..."}, {"speaker": "Student", "line": "..."}, ...]
Make it educational, natural, and engaging.`;
    const rawText = await provider.chat([{ role: "user", text: prompt }], {});
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");
    const script = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: { script, topic } });
  } catch (err) {
    console.error("Podcast error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate podcast." });
  }
});

// ── POST /api/ai/exam/generate ───────────────────────────────────────────────
// Generate a structured mock exam
router.post("/exam/generate", protect, enforceAILimit, async (req, res) => {
  const { noteContent, numQuestions = 5, examType = "mixed", provider: reqProvider } = req.body;
  if (!noteContent?.trim()) {
    return res.status(400).json({ success: false, message: "noteContent is required." });
  }
  try {
    const provider = getProvider(reqProvider);
    const prompt = `Create a ${examType} mock exam with exactly ${numQuestions} questions based on this content.
Return ONLY a JSON array (no markdown, no explanation):
[{
  "id": 1,
  "type": "mcq",
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "explanation": "..."
}, {
  "id": 2,
  "type": "short",
  "question": "...",
  "sampleAnswer": "...",
  "keyPoints": ["point1", "point2"]
}]
Types: "mcq" (multiple choice) or "short" (short answer). Mix both if examType is "mixed".
Content:
${noteContent.substring(0, 5000)}`;
    const rawText = await provider.chat([{ role: "user", text: prompt }], {});
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const questions = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: { questions } });
  } catch (err) {
    console.error("Exam generate error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate exam." });
  }
});

// ── POST /api/ai/exam/grade ──────────────────────────────────────────────────
// AI-grade a completed exam
router.post("/exam/grade", protect, enforceAILimit, async (req, res) => {
  const { questions = [], answers = {}, noteContent = "", provider: reqProvider } = req.body;
  if (!questions.length) {
    return res.status(400).json({ success: false, message: "Questions are required." });
  }
  try {
    const provider = getProvider(reqProvider);
    const qaText = questions.map((q, i) => {
      const userAnswer = answers[q.id] || answers[i] || "(no answer)";
      return `Q${i+1} [${q.type}]: ${q.question}\nUser Answer: ${userAnswer}\n${q.type === "mcq" ? `Correct: ${q.correctAnswer}` : `Sample Answer: ${q.sampleAnswer || ""}`}`;
    }).join("\n\n");

    const prompt = `You are an expert exam grader. Grade these exam answers and return ONLY a JSON object (no markdown):
{
  "score": 75,
  "totalQuestions": 5,
  "correctCount": 3,
  "feedback": "Overall feedback about performance...",
  "weakTopics": ["topic1", "topic2"],
  "questionFeedback": [{"id": 1, "correct": true, "feedback": "..."}, ...],
  "studyRecommendations": ["Recommendation 1", "Recommendation 2"]
}

Questions and Answers:
${qaText}`;
    const rawText = await provider.chat([{ role: "user", text: prompt }], {});
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Exam grade error:", err.message);
    res.status(500).json({ success: false, message: "Failed to grade exam." });
  }
});

module.exports = router;

