const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:       { type: String, required: true },
  noteId:      { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null },
  noteName:    { type: String, default: "" },
  examType:    { type: String, enum: ["mcq", "short", "mixed"], default: "mixed" },
  questions:   [{ type: mongoose.Schema.Types.Mixed }],
  answers:     { type: mongoose.Schema.Types.Mixed, default: {} },
  score:       { type: Number, default: 0 },
  feedback:    { type: String, default: "" },
  weakTopics:  [{ type: String }],
  questionFeedback: [{ type: mongoose.Schema.Types.Mixed }],
  studyRecommendations: [{ type: String }],
  timeTaken:   { type: Number, default: 0 }, // seconds
  completed:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Exam", ExamSchema);
