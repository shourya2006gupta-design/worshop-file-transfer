import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const METADATA_FILE = path.join(UPLOADS_DIR, 'metadata.json');
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory file registry with persistent JSON backing
const fileRegistry = new Map();

function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      for (const [id, item] of Object.entries(data)) {
        fileRegistry.set(id, item);
      }
      console.log(`[QuickShare] Loaded ${fileRegistry.size} stored files from metadata.`);
    }
  } catch (err) {
    console.warn('[QuickShare] Could not read metadata file, starting fresh:', err.message);
  }
}

function saveMetadata() {
  try {
    const obj = {};
    for (const [id, item] of fileRegistry.entries()) {
      obj[id] = item;
    }
    fs.writeFileSync(METADATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[QuickShare] Error saving metadata:', err.message);
  }
}

// Load metadata on startup
loadMetadata();

// Expired files cleanup routine
function cleanupExpiredFiles() {
  const now = Date.now();
  let deletedCount = 0;

  for (const [id, meta] of fileRegistry.entries()) {
    const expiresAtTime = new Date(meta.expiresAt).getTime();
    if (now >= expiresAtTime) {
      // Remove disk file
      const filePath = path.join(UPLOADS_DIR, meta.savedFileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`[QuickShare] Failed to delete disk file ${meta.savedFileName}:`, e.message);
        }
      }
      fileRegistry.delete(id);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    saveMetadata();
    console.log(`[QuickShare Cleanup] Removed ${deletedCount} expired file(s).`);
  }
}

// Run cleanup immediately and then every 30 minutes
cleanupExpiredFiles();
setInterval(cleanupExpiredFiles, 30 * 60 * 1000);

// Setup Middlewares
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Setup Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate safe unique filename on disk
    const uniqueHex = crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).slice(0, 15) || '';
    cb(null, `${Date.now()}-${uniqueHex}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  }
});

// Helper for generating shareable short ID (friendly alphanumeric, 10 characters)
function generateTransferId() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10);
}

// ================= ROUTES ================= //

// 1. Health check
app.get('/api/health', (req, res) => {
  cleanupExpiredFiles();
  res.json({
    status: 'ok',
    message: 'QuickShare server running smoothly',
    activeTransfers: fileRegistry.size,
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
    expiryHours: 24
  });
});

// 2. Upload file
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `File is too large! Maximum allowed size is 25 MB.`
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a file to upload.' });
    }

    const id = generateTransferId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_DURATION_MS);

    const metadata = {
      id,
      originalName: req.file.originalname,
      savedFileName: req.file.filename,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      downloadsCount: 0
    };

    fileRegistry.set(id, metadata);
    saveMetadata();

    console.log(`[QuickShare] File uploaded: "${metadata.originalName}" (${metadata.size} bytes) with ID: ${id}`);

    return res.status(201).json({
      success: true,
      id,
      originalName: metadata.originalName,
      size: metadata.size,
      mimeType: metadata.mimeType,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      message: 'File uploaded successfully! Ready to share.'
    });
  });
});

// 3. Get file details (for download page preview)
app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const meta = fileRegistry.get(id);

  if (!meta) {
    return res.status(404).json({
      error: 'File not found. The transfer link may be invalid or the file has expired and been deleted.'
    });
  }

  // Check expiry
  const now = Date.now();
  const expiresAtTime = new Date(meta.expiresAt).getTime();
  if (now >= expiresAtTime) {
    // Delete file immediately
    const filePath = path.join(UPLOADS_DIR, meta.savedFileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    fileRegistry.delete(id);
    saveMetadata();

    return res.status(410).json({
      error: 'This file has expired (files are kept for 24 hours) and is no longer available.'
    });
  }

  // Check disk existence
  const filePath = path.join(UPLOADS_DIR, meta.savedFileName);
  if (!fs.existsSync(filePath)) {
    fileRegistry.delete(id);
    saveMetadata();
    return res.status(404).json({
      error: 'File contents are unavailable or removed from server.'
    });
  }

  const remainingMs = Math.max(0, expiresAtTime - now);
  const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

  res.json({
    success: true,
    file: {
      id: meta.id,
      originalName: meta.originalName,
      size: meta.size,
      mimeType: meta.mimeType,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      remainingHours,
      downloadsCount: meta.downloadsCount
    }
  });
});

// 4. Download actual file
app.get('/api/files/:id/download', (req, res) => {
  const { id } = req.params;
  const meta = fileRegistry.get(id);

  if (!meta) {
    return res.status(404).json({
      error: 'File not found or transfer link is invalid.'
    });
  }

  // Check expiry
  const now = Date.now();
  const expiresAtTime = new Date(meta.expiresAt).getTime();
  if (now >= expiresAtTime) {
    const filePath = path.join(UPLOADS_DIR, meta.savedFileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    fileRegistry.delete(id);
    saveMetadata();
    return res.status(410).json({
      error: 'This file transfer has expired and is no longer available.'
    });
  }

  const filePath = path.join(UPLOADS_DIR, meta.savedFileName);
  if (!fs.existsSync(filePath)) {
    fileRegistry.delete(id);
    saveMetadata();
    return res.status(404).json({
      error: 'File no longer exists on disk.'
    });
  }

  meta.downloadsCount = (meta.downloadsCount || 0) + 1;
  saveMetadata();

  // Send as download attachment with original filename
  res.download(filePath, meta.originalName, (err) => {
    if (err) {
      console.error(`[QuickShare] Error sending file to client:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file.' });
      }
    }
  });
});

// Production Frontend Serving
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  console.log(`[QuickShare] Serving static frontend from: ${FRONTEND_DIST}`);
}

// 404 Fallback & SPA Client-side routing fallback
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[QuickShare Server Error]:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`
==================================================
  ⚡ QuickShare Backend Server is running!
  📡 API URL: http://localhost:${PORT}
  📁 Upload Directory: ${UPLOADS_DIR}
  ⏱️ Expiry Duration: 24 Hours
  📦 Max File Size: 25 MB
==================================================
  `);
});
