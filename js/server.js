require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const connectDB = require('./src/config/db');


const app = express();

// =============================
// 🧩 Middleware
// =============================
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// =============================
// 📂 Ensure uploads directory exists
// =============================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
app.use('/uploads', express.static(uploadsDir));

// =============================
// 🌐 Serve static frontend (index.html, student.html, etc.)
// =============================
app.use(express.static(path.join(__dirname)));

// =============================
// ⚙️ Multer Configuration for Image Uploads
// =============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error('Only JPG, JPEG, or PNG files are allowed'));
  },
});

// =============================
// 🔌 API Routes
// =============================
app.use('/api/students', require('./src/routes/student'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api', require('./src/routes/public'));

// =============================
// 🧾 Problem Report Submission
// =============================
app.post('/api/problems/report', upload.array('images', 5), async (req, res) => {
});


// =============================
// 🩺 Health Check
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
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =============================
// 🚀 Start Server
// =============================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('✅ Ready to receive problem reports');
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });