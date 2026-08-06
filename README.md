# CSTC — Customer Support Ticket System

A full-stack Customer Support Ticket System built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## 🚀 Quick Start (Fresh Clone)

### Step 1 — Prerequisites
Make sure these are installed on your machine:
- [Node.js 18+](https://nodejs.org) — check with `node -v`
- [Git](https://git-scm.com)
- MongoDB — either [local install](https://www.mongodb.com/try/download/community) or a free [MongoDB Atlas](https://cloud.mongodb.com) account

### Step 2 — Clone the repo
```bash
git clone https://github.com/Bikash107/CSTC.git
cd CSTC
```

### Step 3 — Install all dependencies
```bash
npm run install:all
```
This installs packages for the root, backend, and frontend in one command.

### Step 4 — Set up environment variables
```bash
# Windows
copy backend\.env.example backend\.env

# Mac / Linux
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in:
```ini
PORT=3000
MONGO_URI=mongodb://localhost:27017/cstc_db
JWT_SECRET=any_long_random_string_here
```

> If using **MongoDB Atlas**, replace `MONGO_URI` with your Atlas connection string.

### Step 5 — Run everything
```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |

---

## 👥 User Roles

| Role | How to get it | What they can do |
|------|--------------|-----------------|
| **Customer** | Register normally | Submit & track tickets |
| **Agent** | Admin promotes | Work the ticket queue, reply, change status |
| **Admin** | Set manually in DB | Full system control, user management |

> **First admin:** Register → open MongoDB → set `role: "admin"` on your user → log in again.

---

## 📋 Features

- 🔐 JWT Authentication (login / register)
- 🎫 Create, view, and manage support tickets
- 💬 Comment threads per ticket (with internal notes for staff)
- 📎 File attachments
- 🧑‍💼 Agent queue with priority filter
- 👑 Admin dashboard with live stats
- 👥 User role management
- 📱 Fully responsive dark-mode UI

---

## 🗂 Project Structure

```
CSTC/
├── package.json          ← Root scripts (dev, build, install:all)
├── render.yaml           ← Render deployment config
├── backend/
│   ├── index.js          ← Express API + Mongoose models
│   ├── db.js             ← MongoDB connection
│   ├── .env              ← Your secrets (never committed)
│   └── .env.example      ← Template for .env
└── frontend/
    └── src/
        ├── pages/        ← All page components
        ├── components/   ← Navbar, Badges, ProtectedRoute
        ├── context/      ← AuthContext, ToastContext
        └── api/          ← Axios API layer
```

---

## ☁️ Deploying to Render

Set these environment variables in your Render service:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | A strong random string |

**Build command:** `npm run build`  
**Start command:** `npm start`
