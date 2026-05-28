const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { getMockMode } = require("../config/db");
const { mockUsers } = require("../utils/mockStore");

// Conditionally require mongoose model
let User;
try { User = require("../models/User"); } catch (_) {}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Brute-force protection: max 10 login attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Spam protection: max 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many accounts created from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", registerLimiter, async (req, res) => {
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
router.post("/login", loginLimiter, async (req, res) => {
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

// ── POST /api/auth/forgotpassword ────────────────────────────────────────────
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Please provide an email." });

  let user;
  if (getMockMode()) {
    user = await mockUsers.findOne({ email });
  } else {
    user = await User.findOne({ email });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: "There is no user with that email." });
  }

  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  if (getMockMode()) {
    await mockUsers.findByIdAndUpdate(user._id || user.id, { resetPasswordToken, resetPasswordExpire });
  } else {
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();
  }

  // Create reset URL (dynamically use the request origin to support both localhost and Vercel)
  const clientUrl = req.headers.origin || process.env.CLIENT_URL?.split(",")[0] || "http://localhost:5173";
  const resetUrl = `${clientUrl}/resetpassword/${resetToken}`;

  // Log to console instead of sending email (since SMTP is not configured)
  console.log("\n==================================================");
  console.log("🔒 PASSWORD RESET REQUESTED");
  console.log(`Email: ${user.email}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log("==================================================\n");

  res.status(200).json({ success: true, message: "Email sent (Check server console for the reset link!)" });
});

// ── PUT /api/auth/resetpassword/:resettoken ──────────────────────────────────
router.put("/resetpassword/:resettoken", async (req, res) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

  let user;
  if (getMockMode()) {
    user = await mockUsers.findOne({ 
      resetPasswordToken, 
      resetPasswordExpire: { $gt: Date.now() } 
    });
  } else {
    user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }

  if (!user) {
    return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
  }

  if (getMockMode()) {
    const bcrypt = require("bcryptjs");
    const hashed = await bcrypt.hash(req.body.password, 12);
    await mockUsers.findByIdAndUpdate(user._id || user.id, { 
      password: hashed, 
      resetPasswordToken: undefined, 
      resetPasswordExpire: undefined 
    });
    user = await mockUsers.findById(user._id || user.id);
  } else {
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  }

  const token = signToken(user._id || user.id);
  res.status(200).json({
    success: true,
    token,
    user: { id: user._id || user.id, name: user.name, email: user.email, plan: user.plan }
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
