const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "" },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
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

module.exports = mongoose.model("User", UserSchema);
