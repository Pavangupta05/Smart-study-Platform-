const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
const { mockUsers } = require("../utils/mockStore");

let User;
try { User = require("../models/User"); } catch (_) {}

// GET /api/settings
router.get("/", protect, async (req, res) => {
  if (getMockMode()) {
    const user = await mockUsers.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, settings: user.settings, user });
  }
  const user = await User.findById(req.userId).select("settings name email avatar bio plan studyStats");
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, settings: user.settings, user });
});

// PUT /api/settings
router.put("/", protect, async (req, res) => {
  const { settings, name, email, bio, avatar } = req.body;
  const update = {};
  
  // Safe partial update for settings using dot notation
  if (settings) {
    Object.keys(settings).forEach(key => {
      update[`settings.${key}`] = settings[key];
    });
  }
  
  if (name) update.name = name;
  if (email) update.email = email;
  if (bio !== undefined) update.bio = bio;
  if (avatar) update.avatar = avatar;

  if (getMockMode()) {
    const user = await mockUsers.findByIdAndUpdate(req.userId, update);
    return res.json({ success: true, message: "Settings saved.", user });
  }
  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  res.json({ success: true, message: "Settings saved.", user });
});

// PUT /api/settings/stats
router.put("/stats", protect, async (req, res) => {
  const { streak, cardsMastered, focusTime, examDate } = req.body;
  const update = {};
  if (streak !== undefined) update["studyStats.streak"] = streak;
  if (cardsMastered !== undefined) update["studyStats.cardsMastered"] = cardsMastered;
  if (focusTime !== undefined) update["studyStats.focusTime"] = focusTime;
  if (examDate !== undefined) update["studyStats.examDate"] = examDate;

  if (getMockMode()) {
    const user = await mockUsers.findByIdAndUpdate(req.userId, update);
    return res.json({ success: true, studyStats: user?.studyStats || {} });
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true });
  res.json({ success: true, studyStats: user.studyStats });
});

module.exports = router;
