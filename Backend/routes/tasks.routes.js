const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockTasks } = require("../utils/mockStore");

let Task;
try { Task = require("../models/Task"); } catch (_) {}

// GET /api/tasks
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const tasks = await mockTasks.find({ user: req.userId });
    return res.json({ success: true, tasks });
  }
  const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, tasks });
});

// POST /api/tasks
router.post("/", protect, async (req, res) => {
  const { text, dueDate, priority } = req.body;
  if (!text) return res.status(400).json({ success: false, message: "Task text required." });

  if (getMockMode()) {
    const task = await mockTasks.create({ user: req.userId, text, dueDate, priority });
    return res.status(201).json({ success: true, task });
  }
  const task = await Task.create({ user: req.userId, text, dueDate, priority });
  res.status(201).json({ success: true, task });
});

// PUT /api/tasks/:id
router.put("/:id", protect, async (req, res) => {
  const update = { ...req.body };
  if (update.completed) update.completedAt = new Date();

  if (getMockMode()) {
    const task = await mockTasks.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    return res.json({ success: true, task });
  }
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update, { new: true });
  if (!task) return res.status(404).json({ success: false, message: "Task not found." });
  res.json({ success: true, task });
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    await mockTasks.findOneAndDelete({ _id: req.params.id, user: req.userId });
    return res.json({ success: true, message: "Task deleted." });
  }
  await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Task deleted." });
});

module.exports = router;
