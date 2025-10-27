require('dotenv').config({ path: '.env.local' });
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // ✅ Added multer
const connectDB = require('./src/config/db');

const app = express();

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ----------------------------
// Ensure uploads directory exists (for local) & serve static files
// ----------------------------
let uploadsDir = null;
if (process.env.VERCEL !== '1') {
  uploadsDir = path.join(__dirname, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
  console.log('📁 Serving uploads folder locally');
} else {
  console.log('⚙️ Running on Vercel - skipping uploads folder creation');
}

// ----------------------------
// Serve static frontend files (HTML, CSS, JS)
// ----------------------------
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));

// ----------------------------
// Multer configuration for image uploads
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir || '/tmp'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPG, JPEG, or PNG files are allowed'));
  },
});

// ----------------------------
// ✅ Route for handling problem report + image upload
// ----------------------------
app.post('/api/problems/report', upload.array('images', 5), async (req, res) => {
  try {
    console.log('📩 Problem data received:', req.body);
    console.log('🖼 Uploaded files:', req.files);

    res.status(200).json({
      message: 'Report received successfully!',
      reportId: Date.now(),
      files: req.files.map((f) => `/uploads/${path.basename(f.path)}`),
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err.message);
    res.status(500).json({ error: 'Server error while submitting report' });
  }
});

// ----------------------------
// Frontend routes
// ----------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(publicPath, 'student.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// ----------------------------
// API Routes
// ----------------------------
app.use('/api/student', require('./src/routes/student'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/problems', require('./src/routes/problems'));
app.use('/api/public', require('./src/routes/public'));

// ----------------------------
// Health check route
// ----------------------------
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || mongoose.connection.readyState;
  res.json({ status: 'ok', db: dbState });
});

// ----------------------------
// Start Server after DB connects
// ----------------------------
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Homepage: http://localhost:${PORT}`);
      console.log(`🎓 Student:  http://localhost:${PORT}/student`);
      console.log(`🛠️ Admin:    http://localhost:${PORT}/admin`);
      console.log(`⚙️ Health:   http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
