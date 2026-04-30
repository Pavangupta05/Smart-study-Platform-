require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/auth.routes");
const notesRoutes = require("./routes/notes.routes");
const tasksRoutes = require("./routes/tasks.routes");
const settingsRoutes = require("./routes/settings.routes");
const flashcardsRoutes = require("./routes/flashcards.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "50mb" })); // 50mb to allow base64 file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/flashcards", flashcardsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "StarNote API is running 🚀", timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 StarNote API Server running on http://localhost:${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/health\n`);
});
