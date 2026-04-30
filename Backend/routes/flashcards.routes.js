const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockFlashcards } = require("../utils/mockStore");

let Flashcard;
try { Flashcard = require("../models/Flashcard"); } catch (_) {}

// GET /api/flashcards
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const cards = await mockFlashcards.find({ user: req.userId });
    return res.json({ success: true, cards });
  }
  const cards = await Flashcard.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, cards });
});

// POST /api/flashcards
router.post("/", protect, async (req, res) => {
  const { front, back, deck } = req.body;
  if (!front || !back) return res.status(400).json({ success: false, message: "Front and back required." });

  if (getMockMode()) {
    const card = await mockFlashcards.create({ user: req.userId, front, back, deck: deck || "Default Deck" });
    return res.status(201).json({ success: true, card });
  }
  const card = await Flashcard.create({ user: req.userId, front, back, deck });
  res.status(201).json({ success: true, card });
});

// POST /api/flashcards/bulk
router.post("/bulk", protect, async (req, res) => {
  const { cards, deck } = req.body;
  if (!cards || !Array.isArray(cards)) return res.status(400).json({ success: false, message: "Cards array required." });

  const toCreate = cards.map((c) => ({ ...c, user: req.userId, deck: deck || "Default Deck" }));

  if (getMockMode()) {
    const created = await mockFlashcards.insertMany(toCreate);
    return res.status(201).json({ success: true, cards: created });
  }
  const created = await Flashcard.insertMany(toCreate);
  res.status(201).json({ success: true, cards: created });
});

// PUT /api/flashcards/:id
router.put("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    const card = await mockFlashcards.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body);
    if (!card) return res.status(404).json({ success: false, message: "Card not found." });
    return res.json({ success: true, card });
  }
  const card = await Flashcard.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { ...req.body, lastReviewed: new Date() }, { new: true });
  if (!card) return res.status(404).json({ success: false, message: "Card not found." });
  res.json({ success: true, card });
});

// DELETE /api/flashcards/:id
router.delete("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    await mockFlashcards.findOneAndDelete({ _id: req.params.id, user: req.userId });
    return res.json({ success: true, message: "Flashcard deleted." });
  }
  await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Flashcard deleted." });
});

module.exports = router;
