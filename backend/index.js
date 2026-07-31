const cors = require("cors");
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
app.use(cors());
const PORT = 3000;

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});