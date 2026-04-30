const mongoose = require("mongoose");

let isMockMode = false;

const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI === "PASTE_YOUR_MONGODB_URI_HERE") {
    console.warn("⚠️  MongoDB URI not set. Running in MOCK MODE (in-memory data, not persisted).");
    isMockMode = true;
    return false;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isMockMode = false;
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

const getMockMode = () => isMockMode;

module.exports = { connectDB, getMockMode };
