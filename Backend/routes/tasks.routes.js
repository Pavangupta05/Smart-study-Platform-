const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Task = require("../models/Task");

// GET /api/tasks
router.get("/", protect, async (req, res) => {
  const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, tasks });
});

// POST /api/tasks
router.post("/", protect, async (req, res) => {
  const { text, dueDate, priority } = req.body;
  if (!text) return res.status(400).json({ success: false, message: "Task text required." });
  const task = await Task.create({ user: req.userId, text, dueDate, priority });
  res.status(201).json({ success: true, task });
});

// PUT /api/tasks/:id — toggle or update
router.put("/:id", protect, async (req, res) => {
  const update = req.body;
  if (update.completed !== undefined && update.completed) {
    update.completedAt = new Date();
  }
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    update,
    { new: true }
  );
  if (!task) return res.status(404).json({ success: false, message: "Task not found." });
  res.json({ success: true, task });
});

// DELETE /api/tasks/:id
router.delete("/:id", protect, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Task deleted." });
});

module.exports = router;
