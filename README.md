# CSTC — Customer Support Ticket System

A full-stack Customer Support Ticket System built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: `http://localhost:3000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 👥 User Roles

| Role | Default | Description |
|------|---------|-------------|
| **Customer** | On register | Submit & track tickets |
| **Agent** | Admin promotes | Work the ticket queue |
| **Admin** | Admin promotes | Full system control |

**To create an admin:** Register normally, then in MongoDB set `role: "admin"` for that user. Or use the Admin > User Management page once you have an admin.

---

## 📋 Features

- 🔐 JWT Authentication (login / register)
- 🎫 Create, view, and manage support tickets
- 💬 Comment threads per ticket
- 📎 File attachments
- 🧑‍💼 Agent queue with priority filter
- 👑 Admin dashboard with live stats
- 👥 User role management
- 📱 Responsive dark-mode UI

---

## 🗂 Project Structure

```
CSTC/
├── backend/          # Node.js + Express + MongoDB
│   ├── index.js      # API routes + Mongoose models
│   ├── db.js         # MongoDB connection
│   └── .env          # Secrets (MONGO_URI, JWT_SECRET)
└── frontend/         # React + Vite SPA
    └── src/
        ├── pages/    # All page components
        ├── components/
        ├── context/  # AuthContext, ToastContext
        └── api/      # Axios API layer
```
