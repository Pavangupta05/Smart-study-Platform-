const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getMockMode } = require("../config/db");
const { mockUsers } = require("../utils/mockStore");

// Conditionally require mongoose model
let User;
try { User = require("../models/User"); } catch (_) {}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields are required." });

  if (getMockMode()) {
    // MOCK MODE
    const exists = await mockUsers.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: "Email already registered." });

    const user = await mockUsers.create({ name, email, password });
    const token = signToken(user._id);
    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
    });
  }

  // REAL DB MODE
  const exists = await User.findOne({ email });
  if (exists)
    return res.status(409).json({ success: false, message: "Email already registered." });

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required." });

  if (getMockMode()) {
    // MOCK MODE
    const user = await mockUsers.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const valid = await mockUsers.comparePassword(user, password);
    if (!valid)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = signToken(user._id);
    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan, settings: user.settings },
    });
  }

  // REAL DB MODE
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: "Invalid credentials." });

  const token = signToken(user._id);
  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, plan: user.plan, settings: user.settings },
  });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const { protect } = require("../middleware/auth");
router.get("/me", protect, async (req, res) => {
  if (getMockMode()) {
    const user = await mockUsers.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user });
  }
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: "User not found." });
  res.json({ success: true, user });
});

module.exports = router;
