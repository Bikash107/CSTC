require("dotenv").config();
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("CSTC backend is running");
});

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)";
    db.query(sql, [name, email, passwordHash], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
      }
      res.status(201).json({ message: "User registered successfully", userId: result.insertId });
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

app.post("/api/tickets", (req, res) => {
  const { customer_id, category_id, subject, description, priority } = req.body;

  if (!customer_id || !subject || !description) {
    return res.status(400).json({ error: "customer_id, subject, and description are required" });
  }

  const sql = `
    INSERT INTO tickets (customer_id, category_id, subject, description, priority)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    customer_id,
    category_id || null,
    subject,
    description,
    priority || "medium"
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(201).json({ message: "Ticket created successfully", ticketId: result.insertId });
  });
});

app.get("/api/tickets", (req, res) => {
  const sql = "SELECT * FROM tickets ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(200).json(results);
  });
});

app.get("/api/tickets/:id", (req, res) => {
  const ticketId = req.params.id;

  const sql = "SELECT * FROM tickets WHERE id = ?";

  db.query(sql, [ticketId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json(results[0]);
  });
});

app.patch("/api/tickets/:id", (req, res) => {
  const ticketId = req.params.id;
  const { status, priority, assigned_agent_id } = req.body;

  const updates = [];
  const values = [];

  if (status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (priority) {
    updates.push("priority = ?");
    values.push(priority);
  }
  if (assigned_agent_id) {
    updates.push("assigned_agent_id = ?");
    values.push(assigned_agent_id);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(ticketId);

  const sql = `UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json({ message: "Ticket updated successfully" });
  });
});

app.post("/api/tickets/:id/comments", (req, res) => {
  const ticketId = req.params.id;
  const { user_id, message, is_internal } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: "user_id and message are required" });
  }

  const sql = "INSERT INTO comments (ticket_id, user_id, message, is_internal) VALUES (?, ?, ?, ?)";
  const values = [ticketId, user_id, message, is_internal ? 1 : 0];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(201).json({ message: "Comment added successfully", commentId: result.insertId });
  });
});

app.get("/api/tickets/:id/comments", (req, res) => {
  const ticketId = req.params.id;

  const sql = `
    SELECT comments.*, users.name AS author_name, users.role AS author_role
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.ticket_id = ?
    ORDER BY comments.created_at ASC
  `;

  db.query(sql, [ticketId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(200).json(results);
  });
});

app.post("/api/tickets/:id/attachments", upload.single("file"), (req, res) => {
  const ticketId = req.params.id;
  const uploadedBy = req.body.uploaded_by;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = "/uploads/" + req.file.filename;
  const fileName = req.file.originalname;

  const sql = "INSERT INTO attachments (ticket_id, file_url, file_name, uploaded_by) VALUES (?, ?, ?, ?)";
  const values = [ticketId, fileUrl, fileName, uploadedBy];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(201).json({ message: "File uploaded successfully", fileUrl: fileUrl });
  });
});

app.get("/api/tickets/:id/attachments", (req, res) => {
  const ticketId = req.params.id;

  const sql = "SELECT * FROM attachments WHERE ticket_id = ?";
  db.query(sql, [ticketId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    }
    res.status(200).json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});