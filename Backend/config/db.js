const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI === "PASTE_YOUR_MONGODB_URI_HERE") {
    console.warn("⚠️  MongoDB URI not set. Running in mock mode (data won't persist).");
    return false;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
