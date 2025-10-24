require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const connectDB = require('./src/config/db');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// =============================
// 📂 Ensure uploads directory exists
// =============================
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// =============================
// 🌐 Serve your static frontend
// =============================
const publicPath = path.join(__dirname);
app.use(express.static(publicPath));

// =============================
// 🔌 Multer setup for image uploads
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPG, JPEG, or PNG files allowed'));
  },
});

// =============================
// 🧩 API Routes
// =============================
app.use('/api/students', require('./src/routes/student'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api', require('./src/routes/public'));

// ✅ New route: handle image + report submission
app.post('/api/problems/report', upload.array('images', 5), async (req, res) => {
  try {
    console.log('📩 Problem data received:', req.body);
    console.log('🖼 Uploaded files:', req.files);

    // If you want to save to MongoDB, you can later add:
    // const Problem = require('./src/models/Problem');
    // const problem = await Problem.create({
    //   ...req.body,
    //   images: req.files.map(f => `/uploads/${path.basename(f.path)}`),
    // });

    res.status(200).json({
      message: 'Report received successfully!',
      reportId: Date.now(),
      files: req.files.map(f => `/uploads/${path.basename(f.path)}`)
    });
  } catch (err) {
    console.error('❌ Error submitting report:', err.message);
    res.status(500).json({ error: 'Server error while submitting report' });
  }
});

// =============================
// 🩺 Health check route
// =============================
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || mongoose.connection.readyState;
  res.json({ status: 'ok', db: dbState });
});

// =============================
// 🏠 Serve homepage
// =============================
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// =============================
// 🚀 Start server after DB connects
// =============================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
