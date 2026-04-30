const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// GET /api/settings
router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.userId).select("settings name email avatar bio plan studyStats");
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, settings: user.settings, user });
});

// PUT /api/settings — update settings
router.put("/", protect, async (req, res) => {
  const { settings, name, email, bio, avatar } = req.body;
  const update = {};
  if (settings) update.settings = settings;
  if (name) update.name = name;
  if (email) update.email = email;
  if (bio !== undefined) update.bio = bio;
  if (avatar) update.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  res.json({ success: true, message: "Settings saved.", user });
});

// PUT /api/settings/stats — update study stats
router.put("/stats", protect, async (req, res) => {
  const { streak, cardsMastered, focusTime } = req.body;
  const update = {};
  if (streak !== undefined) update["studyStats.streak"] = streak;
  if (cardsMastered !== undefined) update["studyStats.cardsMastered"] = cardsMastered;
  if (focusTime !== undefined) update["studyStats.focusTime"] = focusTime;
  update["studyStats.lastStudied"] = new Date();

  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true });
  res.json({ success: true, studyStats: user.studyStats });
});

module.exports = router;
