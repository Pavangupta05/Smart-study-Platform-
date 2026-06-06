const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getMockMode } = require("../config/db");
let Notification;
try { Notification = require("../models/Notification"); } catch (_) {}

// @route   GET /api/notifications
// @desc    Get all notifications for the logged-in user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    if (getMockMode() || !Notification) {
      return res.json({ notifications: [] });
    }
    const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read for user
// @access  Private
router.patch("/read-all", protect, async (req, res) => {
  try {
    if (getMockMode() || !Notification) return res.json({ message: "All notifications marked as read (mock)" });
    await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating notifications" });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
router.patch("/:id/read", protect, async (req, res) => {
  try {
    if (getMockMode() || !Notification) return res.json({ notification: { _id: req.params.id, read: true } });
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating notification" });
  }
});

// @route   DELETE /api/notifications/clear
// @desc    Clear all notifications for user
// @access  Private
router.delete("/clear", protect, async (req, res) => {
  try {
    if (getMockMode() || !Notification) return res.json({ message: "All notifications cleared (mock)" });
    await Notification.deleteMany({ user: req.userId });
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error clearing notifications" });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Clear a specific notification
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    if (getMockMode() || !Notification) return res.json({ message: "Notification cleared (mock)" });
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error clearing notification" });
  }
});

module.exports = router;
