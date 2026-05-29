const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  time: { type: String, default: "" }, // e.g. "08:00" for planner
  priority: { type: String, enum: ["low", "medium", "high", "None", "Low", "Medium", "High"], default: "Medium" },
  type: { type: String, enum: ["task", "break"], default: "task" }
}, { timestamps: true });

// Indexes for common task queries
TaskSchema.index({ user: 1, createdAt: -1 });  // Main listing query
TaskSchema.index({ user: 1, completed: 1 });    // Filter by completion

module.exports = mongoose.model("Task", TaskSchema);
