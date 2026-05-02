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

module.exports = mongoose.model("Task", TaskSchema);
