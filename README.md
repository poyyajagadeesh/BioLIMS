# 🧬 BioLIMS — Lab Information & Experiment Management System

A full-stack web application for managing biomedical research lab projects, experiments, protocols, and daily workflows. Built for both **wet-lab** and **dry-lab** research teams.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 📊 Dashboard
- Real-time lab overview with stats, active experiments, reminders, and team progress
- Quick-action buttons for creating projects, experiments, and protocols

### 📁 Project Management
- Create & track multi-experiment research projects
- Assign team members, set timelines, and monitor progress
- Status tracking: Planning → Active → Completed → Archived

### 🧪 Experiment Tracking
- **Wet-lab**: Cell culture details (cell line, media, passage, treatment, incubation)
- **Dry-lab**: Algorithm, dataset, scripts, git references, parameters, logs
- Subtask management with per-experiment progress calculation
- Link experiments to projects and protocols

### 📋 Protocols & SOPs
- Categorized protocol library (Cell Culture, Western Blot, qPCR, NGS, Bioinformatics, etc.)
- Version tracking and experiment linkage

### 📅 Daily Planner
- Schedule daily lab tasks with check-in/check-out times
- Link tasks to experiments and assign to team members
- Drag-and-drop reordering

### 🔔 Reminders
- Time-based reminders for incubation, passage, treatment, and custom events
- Priority levels (Low → Critical) with overdue tracking
- Filter by today, 24h, week, or overdue

### 👥 Lab Members
- Role-based access (Admin, PI, Senior, Researcher, Student)
- Member profiles with expertise tags and workload overview

### 📎 File Repository
- Upload and organize research files (up to 50MB)
- Tag-based organization with entity linking
- Download and delete capabilities

### 📝 Activity Log
- Full audit trail of all actions across the system

---

## 🛠 Tech Stack

| Layer      | Technology                         |
|------------|-------------------------------------|
| **Frontend** | React 18, Vite, React Router, Recharts, Lucide Icons |
| **Backend**  | Node.js, Express, Sequelize ORM    |
| **Database** | SQLite                              |
| **Auth**     | JWT (JSON Web Tokens) + bcrypt      |
| **Styling**  | Custom CSS (Premium dark theme)     |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm**

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/mTracker.git
cd mTracker
```

### 2. Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up environment
```bash
# backend/.env (already included with defaults)
PORT=5000
JWT_SECRET=lims-jwt-secret-change-in-production-2024
DB_PATH=./data/lims.db
UPLOAD_DIR=./uploads
```

### 4. Seed the database (optional)
```bash
cd backend
npm run seed
```

This creates sample data with the following login credentials:

| Role       | Email              | Password      |
|------------|-------------------|---------------|
| Admin      | admin@lab.org      | password123   |
| PI         | priya@lab.org      | password123   |
| Senior     | rahul@lab.org      | password123   |
| Researcher | ananya@lab.org     | password123   |
| Student    | meera@lab.org      | password123   |

### 5. Start the application
```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📂 Project Structure

```
mTracker/
├── backend/
│   ├── .env                  # Environment config
│   ├── package.json
│   └── src/
│       ├── server.js         # Express server entry point
│       ├── db.js             # SQLite/Sequelize connection
│       ├── seed.js           # Sample data seeder
│       ├── middleware/
│       │   └── auth.js       # JWT auth & role middleware
│       ├── models/
│       │   └── index.js      # All Sequelize models & associations
│       └── routes/
│           ├── auth.js       # Register, login, me
│           ├── projects.js   # Project CRUD
│           ├── experiments.js# Experiment CRUD + subtasks
│           ├── protocols.js  # Protocol CRUD
│           ├── members.js    # Member CRUD + workload
│           ├── reminders.js  # Reminder CRUD + completion
│           ├── planner.js    # Daily task CRUD + check-in/out
│           ├── files.js      # File upload/download
│           ├── dashboard.js  # Aggregated dashboard stats
│           └── activity.js   # Activity log
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Routes & protected routes
│       ├── api.js            # Axios API client
│       ├── index.css         # Full design system (1400+ lines)
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   └── Sidebar.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Projects.jsx
│           ├── ProjectDetail.jsx
│           ├── Experiments.jsx
│           ├── ExperimentDetail.jsx
│           ├── Members.jsx
│           ├── Protocols.jsx
│           ├── Planner.jsx
│           ├── Reminders.jsx
│           ├── Files.jsx
│           ├── Activity.jsx
│           └── Login.jsx
│
└── README.md
```

---

## 🔑 API Endpoints

| Method  | Endpoint                          | Description              |
|---------|-----------------------------------|--------------------------|
| POST    | `/api/auth/register`              | Register new user        |
| POST    | `/api/auth/login`                 | Login                    |
| GET     | `/api/auth/me`                    | Get current user         |
| GET/POST/PUT/DELETE | `/api/projects`       | Project management       |
| GET/POST/PUT/DELETE | `/api/experiments`    | Experiment management    |
| POST    | `/api/experiments/:id/subtasks`   | Add subtask              |
| GET/POST/PUT/DELETE | `/api/protocols`      | Protocol management      |
| GET/PUT/DELETE      | `/api/members`        | Member management        |
| GET/POST/PUT/DELETE | `/api/reminders`      | Reminder management      |
| GET/POST/PUT/DELETE | `/api/planner`        | Daily planner            |
| POST    | `/api/files/upload`               | Upload file              |
| GET     | `/api/files/:id/download`         | Download file            |
| GET     | `/api/dashboard`                  | Dashboard aggregation    |
| GET     | `/api/activity`                   | Activity log             |

---

## � Git Push to GitHub

### First-time setup
```bash
cd /home/ribsbioinfo/mTracker

# Add your GitHub remote
git remote add origin https://github.com/<your-username>/mTracker.git

# Push to GitHub
git push -u origin main
```

### For subsequent pushes
```bash
git add -A
git commit -m "your commit message"
git push
```

> **Note:** Make sure you have created an empty repository on GitHub first (without README or .gitignore) before pushing.

---

## �📄 License

MIT License — free to use and modify for your lab.
