# ⚡ QuickShare — Ephemeral File Sharing Web App

A clean, modern, and privacy-focused temporary file sharing application built with **React (Vite)** on the frontend and **Node.js (Express)** on the backend. Files are uploaded with a 25 MB limit, stored temporarily with automatic QR code generation, and self-destruct after **24 hours**.

---

## 🐙 Push to GitHub

This repository is already initialized and committed locally on branch `main`. To push it to your GitHub account:

### 1. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `quickshare`).
3. Leave it empty (do **not** initialize with README or .gitignore).

### 2. Connect Remote and Push
In your project terminal, run:
```bash
# Add your GitHub repository as remote origin
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/quickshare.git

# Ensure you are on the main branch
git branch -M main

# Push code to GitHub
git push -u origin main
```

---

## 🚀 Cloud Deployment Options

### Option 1: Unified 1-Service Deployment (Render / Railway / Koyeb)
Because this repository includes a root `package.json` and Express statically serves the compiled React app (`frontend/dist`) in production, you can deploy both frontend & backend as a single service!

1. Link your GitHub repo to [Render](https://render.com) or [Railway](https://railway.app).
2. Choose **Web Service** with:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `5001` (or default assigned by host)

### Option 2: Docker Container
A production multi-stage [Dockerfile](Dockerfile) is included:
```bash
# Build Docker image
docker build -t quickshare .

# Run container
docker run -p 5001:5001 quickshare
```
Open `http://localhost:5001`.

### Option 3: Separate Deployment (Frontend on Vercel + Backend on Render)
- **Backend (Render / Railway)**:
  - Root directory: `backend`
  - Build command: `npm install`
  - Start command: `node server.js`
  - Set `FRONTEND_URL` to your Vercel URL (e.g. `https://quickshare.vercel.app`)
- **Frontend (Vercel / Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_URL=https://your-backend-api.onrender.com`

---

## 💻 Local Development

### 1. Start the Backend Server (Port 5001)
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend Server (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

Or from the root directory:
```bash
npm run install:all
npm run dev:backend   # in terminal 1
npm run dev:frontend  # in terminal 2
```

---

## 📁 Project Structure

```text
├── .github/
│   └── workflows/
│       └── ci.yml        # Automated GitHub Actions build & test workflow
├── backend/
│   ├── uploads/          # Temporary file storage + metadata.json
│   ├── server.js         # Express API, 24h cleanup, & static frontend serving
│   ├── .env.example      # Environment variables template
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── favicon.svg   # QuickShare logo
│   ├── src/
│   │   ├── App.jsx       # Homepage, upload UI, QR code generator & download page
│   │   ├── index.css     # Minimalist dark theme & micro-animations
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js    # Dev proxy to backend
│   └── package.json
├── Dockerfile            # Multi-stage production container
├── .dockerignore
├── .gitignore            # Clean git rules (ignores node_modules, dist, uploads)
├── package.json          # Root scripts for cloud PaaS deployments
└── README.md
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and active transfer stats |
| `POST` | `/api/upload` | Upload single file (multipart form with `file` field, max 25MB) |
| `GET` | `/api/files/:id` | Retrieve file metadata, time remaining, and status |
| `GET` | `/api/files/:id/download` | Direct file download stream with original filename |

---

## ✨ Features Implemented
1. **Minimalist & Animated UI**: Deep obsidian theme with floating ambient aurora orbs, smooth hover levitations, and spring transitions.
2. **Instant QR Code Generation**: Automatically generates a high-contrast QR code for every share link with an animated futuristic laser scanner line and toggle switch. Mobile users can scan to download instantly.
3. **Interactive Drag-and-Drop**: Responsive dropzone with animated dashed glow and floating icon.
4. **Fluid Shimmer Progress Bar**: Real-time progress bar with live percentage and luminous shimmer wave.
5. **25 MB File Guard**: Client-side check and server-side validation.
6. **Shareable Link & One-Click Copy**: Clean copy-to-clipboard button with visual feedback.
7. **Dedicated Download Page**: Shows file details, countdown timer, download count, and direct attachment download.
8. **24-Hour Expiration & Auto-Cleanup**: Files self-destruct after 24 hours. A background routine runs on startup and every 30 minutes to clean up disk storage.
9. **Graceful Error Handling**: Custom states for missing/expired files (HTTP 410), oversized files, or server disconnection.
10. **GitHub & CI Ready**: Pre-configured `.github/workflows/ci.yml`, Dockerfile, `.gitignore`, and root build scripts.
