const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockChats } = require("../utils/mockStore");

let ChatSession;
try { ChatSession = require("../models/ChatSession"); } catch (_) {}

// GET /api/chats (Get latest session for user)
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const session = await mockChats.findOne({ user: req.userId });
    return res.json({ success: true, session: session || { messages: [] } });
  }
  
  // Find or create a single session per user for simplicity (like a continuous chat history)
  let session = await ChatSession.findOne({ user: req.userId });
  if (!session) {
    session = await ChatSession.create({ user: req.userId, messages: [] });
  }
  res.json({ success: true, session });
});

// POST /api/chats/message (Add a message to the session)
router.post("/message", protect, async (req, res) => {
  const { role, text } = req.body;
  if (!role || !text) return res.status(400).json({ success: false, message: "Role and text required." });

  if (getMockMode()) {
    let session = await mockChats.findOne({ user: req.userId });
    if (!session) {
      session = await mockChats.create({ user: req.userId, messages: [{ role, text }] });
    } else {
      session.messages.push({ role, text });
      session = await mockChats.update({ user: req.userId }, { messages: session.messages });
    }
    return res.json({ success: true, session });
  }

  let session = await ChatSession.findOne({ user: req.userId });
  if (!session) {
    session = await ChatSession.create({ user: req.userId, messages: [] });
  }
  session.messages.push({ role, text });
  await session.save();
  
  res.json({ success: true, session });
});

// DELETE /api/chats (Clear history)
router.delete("/", protect, async (req, res) => {
  if (getMockMode()) {
    await mockChats.delete({ user: req.userId });
    return res.json({ success: true, message: "Chat cleared." });
  }
  
  await ChatSession.findOneAndDelete({ user: req.userId });
  res.json({ success: true, message: "Chat cleared." });
});

module.exports = router;
