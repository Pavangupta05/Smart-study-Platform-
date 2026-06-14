const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockUsers } = require("../utils/mockStore");

let User;
try { User = require("../models/User"); } catch (_) {}

// Free plan limits
const FREE_LIMITS = {
  notes: 50,
  aiQueriesPerMonth: 10,
  flashcardDecks: 5,
};

// ── GET /api/billing/usage ─────────────────────────────────────────────────────
router.get("/usage", protect, async (req, res) => {
  let user;
  if (getMockMode()) {
    user = await mockUsers.findById(req.userId);
  } else {
    user = await User.findById(req.userId);
  }
  if (!user) return res.status(404).json({ success: false, message: "User not found." });

  // Reset monthly AI queries if needed
  const now = new Date();
  const resetDate = user.usageStats?.aiQueriesResetDate ? new Date(user.usageStats.aiQueriesResetDate) : null;
  let aiQueriesThisMonth = user.usageStats?.aiQueriesThisMonth || 0;

  if (!resetDate || now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
    aiQueriesThisMonth = 0;
    // Reset in DB
    if (!getMockMode() && User) {
      await User.findByIdAndUpdate(req.userId, {
        "usageStats.aiQueriesThisMonth": 0,
        "usageStats.aiQueriesResetDate": now,
      });
    }
  }

  res.json({
    success: true,
    usage: {
      aiQueriesThisMonth,
      aiQueriesLimit: user.plan === "pro" ? Infinity : FREE_LIMITS.aiQueriesPerMonth,
      notesCount: user.usageStats?.notesCount || 0,
      notesLimit: user.plan === "pro" ? Infinity : FREE_LIMITS.notes,
      plan: user.plan || "free",
    },
    limits: FREE_LIMITS,
  });
});

// ── POST /api/billing/upgrade ──────────────────────────────────────────────────
// Mock upgrade — in production, this would verify a Stripe payment intent
router.post("/upgrade", protect, async (req, res) => {
  const { plan } = req.body;
  if (!["pro", "free"].includes(plan)) {
    return res.status(400).json({ success: false, message: "Invalid plan." });
  }

  let user;
  if (getMockMode()) {
    user = await mockUsers.findByIdAndUpdate(req.userId, { plan });
    user = await mockUsers.findById(req.userId);
  } else {
    user = await User.findByIdAndUpdate(req.userId, { plan }, { new: true });
  }

  if (!user) return res.status(404).json({ success: false, message: "User not found." });

  res.json({
    success: true,
    message: plan === "pro" ? "Successfully upgraded to Pro! 🎉" : "Downgraded to Free plan.",
    user: { id: user._id || user.id, name: user.name, email: user.email, plan: user.plan },
  });
});

// ── POST /api/billing/track-ai-query ─────────────────────────────────────────
// Called by the AI route to increment query count
router.post("/track-ai-query", protect, async (req, res) => {
  if (!getMockMode() && User) {
    await User.findByIdAndUpdate(req.userId, {
      $inc: { "usageStats.aiQueriesThisMonth": 1 },
      $setOnInsert: { "usageStats.aiQueriesResetDate": new Date() },
    });
  }
  res.json({ success: true });
});

module.exports = router;
