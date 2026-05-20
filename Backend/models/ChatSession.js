const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "ai"], required: true },
  text: { type: String, required: true },
});

const ChatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "New Chat" },
  messages: [MessageSchema],
}, { timestamps: true });

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
