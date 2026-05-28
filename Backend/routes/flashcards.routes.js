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

// GET /api/flashcards/due — cards due for review today
router.get("/due", protect, async (req, res) => {
  const now = new Date();
  if (getMockMode()) {
    const all = await mockFlashcards.find({ user: req.userId });
    const due = all.filter(c => !c.nextReviewDate || new Date(c.nextReviewDate) <= now);
    return res.json({ success: true, cards: due, count: due.length });
  }
  const cards = await Flashcard.find({ user: req.userId, nextReviewDate: { $lte: now } }).sort({ nextReviewDate: 1 });
  res.json({ success: true, cards, count: cards.length });
});

// POST /api/flashcards/:id/review — SM-2 spaced repetition review
// grade: 0=Again, 1=Hard, 2=Good, 3=Easy
router.post("/:id/review", protect, async (req, res) => {
  const { grade } = req.body;
  if (grade === undefined || grade < 0 || grade > 3) {
    return res.status(400).json({ success: false, message: "Grade must be 0-3." });
  }

  // SM-2 algorithm
  function sm2(card, grade) {
    let { easeFactor = 2.5, interval = 0, repetitions = 0 } = card;
    if (grade < 2) {
      // Fail — reset to relearn
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    }
    // Clamp ease factor
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02));
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    return { easeFactor, interval, repetitions, nextReviewDate, lastReviewed: new Date(), mastered: repetitions >= 3 && grade >= 2 };
  }

  try {
    if (getMockMode()) {
      const card = await mockFlashcards.findOne({ _id: req.params.id, user: req.userId });
      if (!card) return res.status(404).json({ success: false, message: "Card not found." });
      const updates = sm2(card, grade);
      const updated = await mockFlashcards.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates);
      return res.json({ success: true, card: { ...updated, ...updates } });
    }
    const card = await Flashcard.findOne({ _id: req.params.id, user: req.userId });
    if (!card) return res.status(404).json({ success: false, message: "Card not found." });
    const updates = sm2(card, grade);
    const updated = await Flashcard.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { ...updates },
      { new: true }
    );
    res.json({ success: true, card: updated });
  } catch (err) {
    console.error("SRS review error:", err);
    res.status(500).json({ success: false, message: "Failed to record review." });
  }
});


router.delete("/:id", protect, async (req, res) => {
  if (getMockMode()) {
    await mockFlashcards.findOneAndDelete({ _id: req.params.id, user: req.userId });
    return res.json({ success: true, message: "Flashcard deleted." });
  }
  await Flashcard.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ success: true, message: "Flashcard deleted." });
});

module.exports = router;
