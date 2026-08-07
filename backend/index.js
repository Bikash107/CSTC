require("dotenv").config();
const dns = require("dns");
// Force Node to resolve DNS using IPv4 first to prevent querySrv ECONNREFUSED on Windows
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// ─── Startup Guard ────────────────────────────────────────────────────────────
if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is not set in environment variables.");
  console.error("   Copy backend/.env.example to backend/.env and fill in JWT_SECRET.");
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// In production (Render), backend serves the frontend — so CORS is same-origin.
// In development, allow the Vite dev server.
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? true  // same-origin, allow all
    : ["http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());

// ─── File Upload ─────────────────────────────────────────────────────────────
const fs = require("fs");
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Accepted: images, PDF, Word, text, zip."));
    }
  },
});
app.use("/uploads", express.static(UPLOADS_DIR));

// ─── Mongoose Models ──────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["customer", "agent", "admin"], default: "customer" },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assigned_agent_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    category: { type: String, default: "General" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed", "reopened"],
      default: "open",
    },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    is_internal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
    file_url: { type: String, required: true },
    file_name: { type: String, required: true },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Attachment = mongoose.model("Attachment", attachmentSchema);

// ─── JWT Middleware ───────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};

// ─── Role Middleware ──────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin access only" });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (req.user?.role !== "agent" && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: staff access only" });
  }
  next();
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("CSTC backend is running (MongoDB)");
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash });
    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Stats (Admin) ────────────────────────────────────────────────────────────
app.get("/api/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: "open" });
    const inProgressTickets = await Ticket.countDocuments({ status: "in_progress" });
    const resolvedTickets = await Ticket.countDocuments({ status: "resolved" });
    const closedTickets = await Ticket.countDocuments({ status: "closed" });
    const urgentTickets = await Ticket.countDocuments({ priority: "urgent" });
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalAgents = await User.countDocuments({ role: "agent" });

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      totalUsers,
      totalAgents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Users (Admin) ────────────────────────────────────────────────────────────
app.get("/api/users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password_hash").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/users/:id/role", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["customer", "agent", "admin"].includes(role))
      return res.status(400).json({ error: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: "-password_hash" });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Tickets ──────────────────────────────────────────────────────────────────
app.post("/api/tickets", verifyToken, async (req, res) => {
  const { category, subject, description, priority } = req.body;
  if (!subject || !description)
    return res.status(400).json({ error: "subject and description are required" });

  try {
    const ticket = await Ticket.create({
      customer_id: req.user.id,
      category: category || "General",
      subject,
      description,
      priority: priority || "medium",
    });
    res.status(201).json({ message: "Ticket created successfully", ticketId: ticket._id, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tickets", verifyToken, async (req, res) => {
  try {
    let query = {};
    // Customers only see their own tickets
    if (req.user.role === "customer") {
      query.customer_id = req.user.id;
    }
    const tickets = await Ticket.find(query)
      .populate("customer_id", "name email")
      .populate("assigned_agent_id", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tickets/:id", verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer_id", "name email")
      .populate("assigned_agent_id", "name email");
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/tickets/:id", verifyToken, async (req, res) => {
  const { status, priority, assigned_agent_id } = req.body;
  const isStaff = req.user.role === "agent" || req.user.role === "admin";
  const updates = {};

  if (status) {
    // Customers can only reopen their own ticket or close it — staff can set any status
    if (!isStaff) {
      const allowed = ["reopened", "closed"];
      if (!allowed.includes(status)) {
        return res.status(403).json({ error: "Customers may only set status to 'reopened' or 'closed'" });
      }
      // Customers can only update their own tickets
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      if (String(ticket.customer_id) !== String(req.user.id)) {
        return res.status(403).json({ error: "Forbidden: not your ticket" });
      }
    }
    updates.status = status;
  }

  // Only staff can change priority or reassign
  if (priority) {
    if (!isStaff) return res.status(403).json({ error: "Forbidden: only staff can change priority" });
    updates.priority = priority;
  }
  if (assigned_agent_id) {
    if (!isStaff) return res.status(403).json({ error: "Forbidden: only staff can assign tickets" });
    updates.assigned_agent_id = assigned_agent_id;
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: "No fields to update" });

  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ message: "Ticket updated successfully", ticket });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Comments ─────────────────────────────────────────────────────────────────
app.post("/api/tickets/:id/comments", verifyToken, async (req, res) => {
  const { message, is_internal } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    const comment = await Comment.create({
      ticket_id: req.params.id,
      user_id: req.user.id,
      message,
      is_internal: is_internal || false,
    });
    res.status(201).json({ message: "Comment added", commentId: comment._id });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tickets/:id/comments", verifyToken, async (req, res) => {
  try {
    const isStaff = req.user.role === "agent" || req.user.role === "admin";
    const query = { ticket_id: req.params.id };
    // Customers must not see internal (staff-only) notes
    if (!isStaff) query.is_internal = false;

    const comments = await Comment.find(query)
      .populate("user_id", "name role")
      .sort({ createdAt: 1 });

    const formatted = comments.map((c) => ({
      _id: c._id,
      message: c.message,
      is_internal: c.is_internal,
      createdAt: c.createdAt,
      author_name: c.user_id?.name,
      author_role: c.user_id?.role,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Attachments ──────────────────────────────────────────────────────────────
// Handle multer errors (file type / size) gracefully
app.post("/api/tickets/:id/attachments", verifyToken, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "File upload error" });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const fileUrl = "/uploads/" + req.file.filename;
    const attachment = await Attachment.create({
      ticket_id: req.params.id,
      file_url: fileUrl,
      file_name: req.file.originalname,
      uploaded_by: req.user.id,
    });
    res.status(201).json({ message: "File uploaded successfully", fileUrl, attachment });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tickets/:id/attachments", verifyToken, async (req, res) => {
  try {
    const attachments = await Attachment.find({ ticket_id: req.params.id });
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Serve React Frontend (Production) ───────────────────────────────────────
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// Catch-all: send React's index.html for any non-API route (client-side routing)
// Note: Express 5 requires {*path} instead of * for wildcards
app.get(/^(?!\/api|\/uploads).*$/, (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
