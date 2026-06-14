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
let billingRoutes;
try { billingRoutes = require("./routes/billing.routes"); } catch (_) {}

// Connect DB as early as possible to avoid race conditions
connectDB();

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

// Strict AI Rate Limiting: max 15 requests per minute per IP to protect OpenAI API
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, error: 'AI request limit reached. Please wait a minute.' }
});

app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);
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

const activeStudyUsers = new Map(); // socketId -> { roomId, user: { id, firstName, initials } }

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on("timer_sync", (data) => {
    // Get user room from socket
    const rooms = Array.from(socket.rooms);
    const userId = rooms.find(r => r !== socket.id && !r.startsWith("study_"));
    if (userId) {
      socket.to(userId).emit("timer_sync", data);
    }
  });

  // Multiplayer Study Room Logic
  socket.on("join_study_room", (data) => {
    socket.join(`study_${data.roomId}`);
    activeStudyUsers.set(socket.id, { roomId: data.roomId, user: data.user });
    
    // Broadcast updated users to everyone in the room
    const usersInRoom = Array.from(activeStudyUsers.values())
      .filter(u => u.roomId === data.roomId)
      .map(u => u.user);
      
    io.to(`study_${data.roomId}`).emit("study_room_users", usersInRoom);
    console.log(`👥 ${data.user.firstName} joined study room ${data.roomId}`);
  });

  socket.on("leave_study_room", (roomId) => {
    socket.leave(`study_${roomId}`);
    activeStudyUsers.delete(socket.id);
    const usersInRoom = Array.from(activeStudyUsers.values())
      .filter(u => u.roomId === roomId)
      .map(u => u.user);
    io.to(`study_${roomId}`).emit("study_room_users", usersInRoom);
  });

  socket.on("disconnect", () => {
    // Cleanup Study Rooms
    const studySession = activeStudyUsers.get(socket.id);
    if (studySession) {
      const { roomId } = studySession;
      activeStudyUsers.delete(socket.id);
      const usersInRoom = Array.from(activeStudyUsers.values())
        .filter(u => u.roomId === roomId)
        .map(u => u.user);
      io.to(`study_${roomId}`).emit("study_room_users", usersInRoom);
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" })); // Reduced to 2mb to prevent DoS via payload exhaustion
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

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
if (billingRoutes) app.use("/api/billing", billingRoutes);

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
