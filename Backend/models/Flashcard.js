const mongoose = require("mongoose");

const FlashcardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deck: { type: String, default: "Default Deck" },
  front: { type: String, required: true },
  back: { type: String, required: true },
  mastered: { type: Boolean, default: false },
  lastReviewed: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Flashcard", FlashcardSchema);
