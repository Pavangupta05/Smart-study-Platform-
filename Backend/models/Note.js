const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: "📄" },
  category: { type: String, default: "general" },
  size: { type: String, default: "0 MB" },
  fileType: { type: String, default: "text" }, // pdf, docx, notebook, etc.
  content: { type: String, default: "" },      // Text content or notebook pages
  blobUrl: { type: String, default: "" },      // Base64 for uploaded files
  pages: [{ type: String }],                   // For notebooks
  notes: [{ type: mongoose.Schema.Types.Mixed }],  // Sticky notes
  connectors: [{ type: mongoose.Schema.Types.Mixed }],
  canvasImages: [{ type: mongoose.Schema.Types.Mixed }],
  bookmarks: [{ type: mongoose.Schema.Types.Mixed }],
  drawHistory: { type: mongoose.Schema.Types.Mixed, default: {} },
  isTrashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
  tags: [{ type: String }],
}, { timestamps: true });

// Auto-delete trash after 30 days
NoteSchema.index({ trashedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model("Note", NoteSchema);
