const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");

let Exam;
try { Exam = require("../models/Exam"); } catch (_) {}

// GET /api/exams — list all user's exams
router.get("/", protect, async (req, res) => {
  if (!Exam) return res.json({ success: true, exams: [] });
  const exams = await Exam.find({ user: req.userId }).sort({ createdAt: -1 }).select("-questions -answers");
  res.json({ success: true, exams });
});

// GET /api/exams/stats — MUST be before /:id so Express doesn't treat "stats" as an id param
router.get("/stats", protect, async (req, res) => {
  if (!Exam) return res.json({ success: true, stats: { totalExams: 0, avgScore: 0, bestScore: 0 } });
  const exams = await Exam.find({ user: req.userId }).select("score");
  const totalExams = exams.length;
  const avgScore = totalExams > 0 ? Math.round(exams.reduce((s, e) => s + (e.score || 0), 0) / totalExams) : 0;
  const bestScore = totalExams > 0 ? Math.max(...exams.map(e => e.score || 0)) : 0;
  res.json({ success: true, stats: { totalExams, avgScore, bestScore } });
});

// GET /api/exams/history — MUST be before /:id for same reason
router.get("/history", protect, async (req, res) => {
  if (!Exam) return res.json({ success: true, exams: [] });
  const exams = await Exam.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, exams });
});

// POST /api/exams — save a completed exam
router.post("/", protect, async (req, res) => {
  if (!Exam) return res.status(500).json({ success: false, message: "DB not available." });
  const {
    title, noteId, noteName, examType, questions, answers,
    score, feedback, weakTopics, questionFeedback, studyRecommendations, timeTaken
  } = req.body;
  const exam = await Exam.create({
    user: req.userId,
    title: title || "Untitled Exam",
    noteId: noteId || null,
    noteName: noteName || "",
    examType: examType || "mixed",
    questions: questions || [],
    answers: answers || {},
    score: score || 0,
    feedback: feedback || "",
    weakTopics: weakTopics || [],
    questionFeedback: questionFeedback || [],
    studyRecommendations: studyRecommendations || [],
    timeTaken: timeTaken || 0,
    completed: true,
  });
  res.status(201).json({ success: true, exam });
});

// GET /api/exams/:id — get full exam detail
router.get("/:id", protect, async (req, res) => {
  if (!Exam) return res.status(404).json({ success: false, message: "Not found." });
  const exam = await Exam.findOne({ _id: req.params.id, user: req.userId });
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });
  res.json({ success: true, exam });
});

// DELETE /api/exams/:id
router.delete("/:id", protect, async (req, res) => {
  if (!Exam) return res.status(404).json({ success: false, message: "Not found." });
  await Exam.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Exam deleted." });
});

module.exports = router;

