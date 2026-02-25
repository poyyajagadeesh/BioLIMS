# 🧬 BioLIMS — Lab Information & Experiment Management System

A full-stack web application for managing biomedical research projects, experiments, protocols, and lab workflows. Supports both wet-lab and dry-lab tracking.

## Tech Stack

- **Frontend**: React 18 + Vite + Recharts + Lucide Icons
- **Backend**: Express.js + Sequelize ORM + SQLite
- **Auth**: JWT-based authentication with bcrypt password hashing

## Features

- 📊 Interactive dashboard with project/experiment analytics
- 📁 Project management with team member assignments
- 🧪 Experiment tracking (Wet-lab, Dry-lab, Computational)
- 📋 Protocol/SOP management with versioning
- 📅 Daily planner with check-in/check-out
- 🔔 Reminder system with priority levels
- 📎 File attachment management
- 📝 Activity logging
- 👥 Team member management with roles (Admin, PI, Senior, Researcher, Student)

## Local Development

### Prerequisites

- Node.js >= 18

### Setup

```bash
# Install all dependencies
npm run build

# Start the backend server (serves frontend in production mode)
npm start

# Or for development with hot reload:
cd backend && npm run dev     # Terminal 1
cd frontend && npm run dev    # Terminal 2
```

### Default Admin Account

- **Email**: poyyaj@biolims.app
- **Password**: Set via `ADMIN_PASSWORD` environment variable

The admin account is auto-created on first server start if no users exist.

## Deploying to Render.com

### Option 1: Blueprint (Recommended)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will auto-detect `render.yaml` and configure everything
6. **Set the `ADMIN_PASSWORD` environment variable** in the Render dashboard to your desired password

### Option 2: Manual Setup

1. Create a **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random secret)
   - `ADMIN_PASSWORD` = (your admin password)
   - `DB_PATH` = `/opt/render/project/data/lims.db`
5. Add a **Disk** (1 GB) mounted at `/opt/render/project/data`

> ⚠️ **Important**: SQLite requires a persistent disk. Without it, your data will be lost on every deploy.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | (required in production) |
| `DB_PATH` | SQLite database file path | `./data/lims.db` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `ADMIN_PASSWORD` | Initial admin password | `changeme` |
| `NODE_ENV` | Environment mode | `development` |

## Project Structure

```
mTracker/
├── backend/
│   ├── src/
│   │   ├── server.js       # Express app + auto-seed
│   │   ├── db.js            # Sequelize config
│   │   ├── seed.js          # Database seeder
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   └── middleware/      # Auth middleware
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router setup
│   │   ├── api.js           # Axios config
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # Auth context
│   │   └── pages/           # Page components
│   ├── vite.config.js
│   └── package.json
├── render.yaml              # Render blueprint
├── package.json             # Root build scripts
└── .gitignore
```

## License

Private — All rights reserved.
