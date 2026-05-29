const mongoose = require("mongoose");

const FlashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deck: { type: String, default: "Default Deck" },
  front: { type: String, required: true },
  back: { type: String, required: true },
  mastered: { type: Boolean, default: false },
  lastReviewed: { type: Date, default: null },
  repetitions: { type: Number, default: 0 },
  interval: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  nextReviewDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for common flashcard queries
FlashcardSchema.index({ user: 1, nextReviewDate: 1 }); // Due cards query
FlashcardSchema.index({ user: 1, createdAt: -1 });      // Listing query

module.exports = mongoose.model("Flashcard", FlashcardSchema);
