const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockChats } = require("../utils/mockStore");

let ChatSession;
try { ChatSession = require("../models/ChatSession"); } catch (_) {}

// GET /api/chats (Get all sessions for user - lightweight)
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const sessions = await mockChats.find({ user: req.userId });
    // return lightweight versions
    const lightweight = sessions.map(s => ({
      _id: s._id,
      title: s.title || "New Chat",
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    }));
    return res.json({ success: true, sessions: lightweight });
  }
  
  const sessions = await ChatSession.find({ user: req.userId }).select("-messages").sort({ updatedAt: -1 });
  res.json({ success: true, sessions });
});

// GET /api/chats/:id (Get specific session)
router.get("/:id", protect, async (req, res) => {
  const { id } = req.params;
  
  if (id === "latest") {
    if (getMockMode()) {
      const sessions = await mockChats.find({ user: req.userId });
      if (sessions.length > 0) return res.json({ success: true, session: sessions[0] });
      return res.json({ success: true, session: { messages: [], title: "New Chat" } });
    }
    const session = await ChatSession.findOne({ user: req.userId }).sort({ updatedAt: -1 });
    if (!session) return res.json({ success: true, session: { messages: [], title: "New Chat" } });
    return res.json({ success: true, session });
  }

  if (getMockMode()) {
    const allSessions = await mockChats.find({ user: req.userId });
    const session = allSessions.find(s => s._id === id);
    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });
    return res.json({ success: true, session });
  }

  const session = await ChatSession.findOne({ _id: id, user: req.userId });
  if (!session) return res.status(404).json({ success: false, message: "Chat not found" });
  res.json({ success: true, session });
});

// POST /api/chats (Create new session)
router.post("/", protect, async (req, res) => {
  const { title = "New Chat", messages = [] } = req.body;
  if (getMockMode()) {
    const session = await mockChats.create({ user: req.userId, title, messages });
    return res.json({ success: true, session });
  }
  const session = await ChatSession.create({ user: req.userId, title, messages });
  res.json({ success: true, session });
});

// POST /api/chats/:id/message (Add a message to the session)
router.post("/:id/message", protect, async (req, res) => {
  const { id } = req.params;
  const { role, text } = req.body;
  if (!role || !text) return res.status(400).json({ success: false, message: "Role and text required." });

  if (id === "new") {
    // create and add
    const title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
    if (getMockMode()) {
      const session = await mockChats.create({ user: req.userId, title, messages: [{ role, text }] });
      return res.json({ success: true, session });
    }
    const session = await ChatSession.create({ user: req.userId, title, messages: [{ role, text }] });
    return res.json({ success: true, session });
  }

  if (getMockMode()) {
    const sessions = await mockChats.find({ user: req.userId });
    let session = sessions.find(s => s._id === id);
    if (!session) return res.status(404).json({ success: false, message: "Chat not found" });
    
    session.messages.push({ role, text });
    if (session.messages.length === 1 && role === "user") {
        session.title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
    }
    session = await mockChats.updateById(id, { messages: session.messages, title: session.title });
    return res.json({ success: true, session });
  }

  let session = await ChatSession.findOne({ _id: id, user: req.userId });
  if (!session) return res.status(404).json({ success: false, message: "Chat not found" });
  
  session.messages.push({ role, text });
  if (session.messages.length === 1 && role === "user") {
      session.title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
  }
  await session.save();
  
  res.json({ success: true, session });
});

// PUT /api/chats/:id (Update title)
router.put("/:id", protect, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  
  if (getMockMode()) {
    const session = await mockChats.updateById(id, { title });
    return res.json({ success: true, session });
  }
  
  const session = await ChatSession.findOneAndUpdate(
    { _id: id, user: req.userId },
    { title },
    { new: true }
  );
  res.json({ success: true, session });
});

// DELETE /api/chats/:id (Delete a session)
router.delete("/:id", protect, async (req, res) => {
  const { id } = req.params;
  
  if (id === "all") {
      if (getMockMode()) {
          await mockChats.delete({ user: req.userId });
          return res.json({ success: true, message: "All chats cleared." });
      }
      await ChatSession.deleteMany({ user: req.userId });
      return res.json({ success: true, message: "All chats cleared." });
  }

  if (getMockMode()) {
    await mockChats.deleteById(id);
    return res.json({ success: true, message: "Chat deleted." });
  }
  
  await ChatSession.findOneAndDelete({ _id: id, user: req.userId });
  res.json({ success: true, message: "Chat deleted." });
});

module.exports = router;
