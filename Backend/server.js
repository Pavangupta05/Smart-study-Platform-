require("dotenv").config(); 
require("express-async-errors");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/auth.routes");
const notesRoutes = require("./routes/notes.routes");
const tasksRoutes = require("./routes/tasks.routes");
const settingsRoutes = require("./routes/settings.routes");
const flashcardsRoutes = require("./routes/flashcards.routes");
const chatRoutes = require("./routes/chat.routes");
const aiRoutes = require("./routes/ai.routes");
const examRoutes = require("./routes/exam.routes");
const notificationsRoutes = require("./routes/notifications.routes");

const app = express();

// Apply security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false // Allow the frontend to embed PDFs in an iframe
}));

// Rate limiting: max 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

// Pass IO to routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on("timer_sync", (data) => {
    // Get user room from socket
    const rooms = Array.from(socket.rooms);
    const userId = rooms.find(r => r !== socket.id);
    if (userId) {
      socket.to(userId).emit("timer_sync", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;

// Connect DB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" })); // 50mb to allow base64 file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/flashcards", flashcardsRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/notifications", notificationsRoutes);

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 StarNote API Server running on http://localhost:${PORT}`);
  console.log(`📚 Health Check: http://localhost:${PORT}/api/health\n`);
});
