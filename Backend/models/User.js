const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "" },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  settings: {
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    language: { type: String, default: "English (US)" },
    emailReports: { type: Boolean, default: true },
    studyReminders: { type: Boolean, default: true },
    hapticsEnabled: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true },
    aiDataUsage: { type: Boolean, default: true },
  },
  studyStats: {
    streak: { type: Number, default: 0 },
    cardsMastered: { type: Number, default: 0 },
    focusTime: { type: Number, default: 0 }, // in minutes
    lastStudied: { type: Date, default: null },
  },
}, { timestamps: true });

// Hash password before save (Mongoose 9+ — async middleware, no `next`)
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // Set expire to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
