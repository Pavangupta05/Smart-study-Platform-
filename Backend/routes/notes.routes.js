const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { getMockMode } = require("../config/db");
const { mockNotes } = require("../utils/mockStore");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer to use memory storage (Compatible with Vercel serverless)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for Vercel/MongoDB safety
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|txt|markdown|md|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error("Invalid file type. Only images, PDFs, and text/doc files are allowed."));
  }
});

let Note;
try { 
  Note = require("../models/Note"); 
} catch (_) {
  console.warn("⚠️ Note model not found, falling back to mock mode only.");
}

// Middleware to ensure Note model exists if not in mock mode
const ensureModel = (req, res, next) => {
  if (!getMockMode() && !Note) {
    return res.status(500).json({ success: false, message: "Database model 'Note' is not available." });
  }
  next();
};

// GET /api/notes
router.get("/", protect, ensureModel, async (req, res) => {
  if (getMockMode()) {
    const notes = await mockNotes.find({ user: req.userId, isTrashed: false });
    return res.json({ success: true, notes });
  }
  const notes = await Note.find({ user: req.userId, isTrashed: false }).sort({ updatedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/trash
router.get("/trash", protect, ensureModel, async (req, res) => {
  if (getMockMode()) {
    const notes = await mockNotes.find({ user: req.userId, isTrashed: true });
    return res.json({ success: true, notes });
  }
  const notes = await Note.find({ user: req.userId, isTrashed: true }).sort({ trashedAt: -1 });
  res.json({ success: true, notes });
});

// GET /api/notes/:id
router.get("/:id", protect, ensureModel, async (req, res) => {
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
router.post("/", protect, ensureModel, upload.single("file"), validate([
    // Basic payload validation – all fields are optional but must be strings if present
    require('express-validator').body('name').optional().isString(),
    require('express-validator').body('icon').optional().isString(),
    require('express-validator').body('category').optional().isString(),
    require('express-validator').body('content').optional().isString(),
    require('express-validator').body('fileType').optional().isString(),
  ]), async (req, res) => {
  let { name, icon, category, content, blobUrl, fileType, size, pages } = req.body;
  
  if (req.file) {
    const base64Str = req.file.buffer.toString("base64");
    blobUrl = `data:${req.file.mimetype};base64,${base64Str}`;
  }

  // Parse JSON arrays if sent via FormData
  if (typeof pages === "string") {
    try {
      pages = JSON.parse(pages);
    } catch (e) {
      pages = [" "];
    }
  }

  const data = { 
    user: req.userId, 
    name: name || "Untitled", 
    icon: icon || "📄", 
    category: category || "general", 
    content: content || "", 
    blobUrl: blobUrl || "", 
    fileType: fileType || "text", 
    size: size || "0 MB", 
    pages: pages || [" "] 
  };

  if (getMockMode()) {
    const note = await mockNotes.create(data);
    req.app.get("io")?.to(req.userId).emit("sync_notes");
    req.app.get("io")?.to(req.userId).emit("notification", { title: "Note Created", message: `Successfully saved '${note.name}'`, type: "success" });
    return res.status(201).json({ success: true, note });
  }
  const note = await Note.create(data);
  req.app.get("io")?.to(req.userId).emit("sync_notes");
  req.app.get("io")?.to(req.userId).emit("notification", { title: "Note Created", message: `Successfully saved '${note.name}'`, type: "success" });
  res.status(201).json({ success: true, note });
});

// PUT /api/notes/:id
router.put("/:id", protect, ensureModel, validate([
    require('express-validator').body('name').optional().isString(),
    require('express-validator').body('icon').optional().isString(),
    require('express-validator').body('category').optional().isString(),
    require('express-validator').body('content').optional().isString(),
    require('express-validator').body('fileType').optional().isString(),
  ]), async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    req.app.get("io")?.to(req.userId).emit("sync_notes");
    return res.json({ success: true, note });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  req.app.get("io")?.to(req.userId).emit("sync_notes");
  res.json({ success: true, note });
});

// DELETE /api/notes/:id — trash
router.delete("/:id", protect, ensureModel, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: true, trashedAt: new Date() });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    req.app.get("io")?.to(req.userId).emit("sync_notes");
    return res.json({ success: true, message: "Note moved to trash." });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: true, trashedAt: new Date() }, { new: true });
  if (!note) return res.status(404).json({ success: false, message: "Note not found." });
  req.app.get("io")?.to(req.userId).emit("sync_notes");
  res.json({ success: true, message: "Note moved to trash." });
});

// DELETE /api/notes/:id/permanent
router.delete("/:id/permanent", protect, ensureModel, async (req, res) => {
  if (getMockMode()) {
    await mockNotes.findOneAndDelete({ _id: req.params.id, user: req.userId });
    req.app.get("io")?.to(req.userId).emit("sync_notes");
    return res.json({ success: true, message: "Note permanently deleted." });
  }
  await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  req.app.get("io")?.to(req.userId).emit("sync_notes");
  res.json({ success: true, message: "Note permanently deleted." });
});

// POST /api/notes/:id/restore
router.post("/:id/restore", protect, ensureModel, async (req, res) => {
  if (getMockMode()) {
    const note = await mockNotes.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: false, trashedAt: null });
    req.app.get("io")?.to(req.userId).emit("sync_notes");
    return res.json({ success: true, note });
  }
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isTrashed: false, trashedAt: null }, { new: true });
  req.app.get("io")?.to(req.userId).emit("sync_notes");
  res.json({ success: true, note });
});

// GET /api/notes/shared/:shareId - Public route (No protect middleware)
router.get("/shared/:shareId", ensureModel, async (req, res) => {
  try {
    if (getMockMode()) {
      return res.status(404).json({ success: false, message: "Public sharing not available in mock mode." });
    }
    const note = await Note.findOne({ shareId: req.params.shareId, isPublic: true, isTrashed: false })
                           .populate("user", "name avatar");
    if (!note) return res.status(404).json({ success: false, message: "Note not found or is not public." });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching public note." });
  }
});

// PATCH /api/notes/:id/share - Toggle public sharing
router.patch("/:id/share", protect, ensureModel, async (req, res) => {
  try {
    if (getMockMode()) {
      return res.status(400).json({ success: false, message: "Public sharing not available in mock mode." });
    }
    
    const { isPublic } = req.body;
    let note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });

    note.isPublic = isPublic;
    if (isPublic && !note.shareId) {
      const crypto = require("crypto");
      note.shareId = crypto.randomBytes(8).toString("hex");
    }
    
    await note.save();
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating share settings." });
  }
});

module.exports = router;
