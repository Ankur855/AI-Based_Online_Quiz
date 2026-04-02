require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./db");

// Load ALL models so Sequelize registers them before sync
require("./Model/index");

const app = express();
const server = http.createServer(app);

// ── Connect SQLite & sync tables ──────────────────────────────────
connectDB();

// ── Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  socket.on("join_room", (userId) => socket.join(`user_${userId}`));
});
app.set("io", io);

// ── Middleware ────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/quizzes", require("./Routes/quizRoutes"));
app.use("/api/questions", require("./Routes/questionRoutes"));
app.use("/api/scores", require("./Routes/scores_attemptRoutes"));
app.use("/api/notifications", require("./Routes/notificationRoutes"));

app.get("/api/health", (_, res) =>
  res.json({
    success: true,
    message: "AdaptIQ running 🚀 (SQLite)",
    env: process.env.NODE_ENV,
  })
);

app.use("*", (req, res) =>
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` })
);
app.use((err, req, res, next) => {
  console.error("💥", err);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 AdaptIQ server on port ${PORT}`);
  console.log(`🗄  Database: SQLite → database.sqlite`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, io };
