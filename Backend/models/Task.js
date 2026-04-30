const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);
