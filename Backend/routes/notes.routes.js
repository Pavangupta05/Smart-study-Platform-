const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockNotes } = require("../utils/mockStore");

let Note;
try { Note = require("../models/Note"); } catch (_) {}

// GET /api/notes
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const notes = await mockNotes.find({ user: req.userId, isTrashed: false });
    return res.json({ success: true, notes });
  }
  const notes = await Note.find({ user: req.userId, isTrashed: false }).sort({ updatedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/trash
router.get("/trash", protect, async (req, res) => {
  if (getMockMode()) {
    const notes = await mockNotes.find({ user: req.userId, isTrashed: true });
    return res.json({ success: true, notes });
  }
  const notes = await Note.find({ user: req.userId, isTrashed: true }).sort({ trashedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/:id
router.get("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    return res.json({ success: true, note });
  }
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, note });
});

// POST /api/notes
router.post("/", protect, async (req, res) => {
  const { name, icon, category, content, blobUrl, fileType, size, pages } = req.body;
  const data = { user: req.userId, name: name || "Untitled", icon: icon || "📄", category: category || "general", content: content || "", blobUrl: blobUrl || "", fileType: fileType || "text", size: size || "0 MB", pages: pages || [" "] };

  if (getMockMode()) {
    const note = await mockNotes.create(data);
    return res.status(201).json({ success: true, note });
  }
  const note = await Note.create(data);
  res.status(201).json({ success: true, note });
});

// PUT /api/notes/:id
router.put("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    return res.json({ success: true, note });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, note });
});

// DELETE /api/notes/:id — trash
router.delete("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: true, trashedAt: new Date() });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    return res.json({ success: true, message: "Note moved to trash." });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: true, trashedAt: new Date() }, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, message: "Note moved to trash." });
});

// DELETE /api/notes/:id/permanent
router.delete("/:id/permanent", protect, async (req, res) => {
  if (getMockMode()) {
    await mockNotes.findOneAndDelete({ _id: req.params.id, user: req.userId });
    return res.json({ success: true, message: "Note permanently deleted." });
  }
  await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Note permanently deleted." });
});

// POST /api/notes/:id/restore
router.post("/:id/restore", protect, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: false, trashedAt: null });
    return res.json({ success: true, note });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: false, trashedAt: null }, { new: true });
  res.json({ success: true, note });
});

module.exports = router;
