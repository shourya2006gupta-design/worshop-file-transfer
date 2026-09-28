# ⚡ QuickShare — Temporary File Sharing Web App

A clean, modern, and beginner-friendly file sharing application built with **React (Vite)** on the frontend and **Node.js (Express)** on the backend. Files are uploaded with a 25 MB limit, stored temporarily, and automatically expire after **24 hours**.

---

## 🚀 Quick Start (Running Both Servers)

### Prerequisites
- Node.js (v18+)
- npm

### 1. Start the Backend Server (Port 5001)
Open a terminal window and run:
```bash
cd backend
npm install
npm run dev
# or: npm start
```
> The backend server will start at: `http://localhost:5001`

### 2. Start the Frontend Server (Port 5173)
Open a second terminal window and run:
```bash
cd frontend
npm install
npm run dev
```
> The frontend application will start at: `http://localhost:5173`

---

## 📁 Project Structure

```text
workshop/
├── backend/
│   ├── uploads/          # Temporary file storage + metadata.json
│   ├── server.js         # Express API with 25MB limit, 24h cleanup, & download routes
│   └── package.json      # Express, cors, multer
├── frontend/
│   ├── public/
│   │   └── favicon.svg   # QuickShare logo
│   ├── src/
│   │   ├── App.jsx       # Complete app with Homepage, Upload UI, and Download View
│   │   ├── index.css     # Dark-mode glassmorphic design system
│   │   └── main.jsx      # React entry point
│   ├── index.html        # HTML template with Google Fonts (Plus Jakarta Sans)
│   ├── vite.config.js    # Vite config with /api proxy to localhost:5001
│   └── package.json
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
