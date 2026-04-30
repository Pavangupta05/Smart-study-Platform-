const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Note = require("../models/Note");

// GET /api/notes — fetch all non-trashed notes for user
router.get("/", protect, async (req, res) => {
  const notes = await Note.find({ user: req.userId, isTrashed: false }).sort({ updatedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/trash — fetch trashed notes
router.get("/trash", protect, async (req, res) => {
  const notes = await Note.find({ user: req.userId, isTrashed: true }).sort({ trashedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/:id — fetch single note
router.get("/:id", protect, async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, note });
});

// POST /api/notes — create note
router.post("/", protect, async (req, res) => {
  const { name, icon, category, content, blobUrl, fileType, size, pages } = req.body;
  const note = await Note.create({
    user: req.userId,
    name: name || "Untitled",
    icon: icon || "📄",
    category: category || "general",
    content: content || "",
    blobUrl: blobUrl || "",
    fileType: fileType || "text",
    size: size || "0 MB",
    pages: pages || [" "],
  });
  res.status(201).json({ success: true, note });
});

// PUT /api/notes/:id — update note
router.put("/:id", protect, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, note });
});

// DELETE /api/notes/:id — move to trash
router.delete("/:id", protect, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { isTrashed: true, trashedAt: new Date() },
    { new: true }
  );
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  res.json({ success: true, message: "Note moved to trash." });
});

// DELETE /api/notes/:id/permanent — permanently delete
router.delete("/:id/permanent", protect, async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Note permanently deleted." });
});

// POST /api/notes/:id/restore — restore from trash
router.post("/:id/restore", protect, async (req, res) => {
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { isTrashed: false, trashedAt: null },
    { new: true }
  );
  res.json({ success: true, note });
});

module.exports = router;
