require('dotenv').config({ path: '.env.local' });
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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
if (process.env.VERCEL !== '1') {
  const uploadsDir = path.join(__dirname, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
  console.log('📁 Serving uploads folder locally');
} else {
  console.log('⚙️ Running on Vercel - skipping uploads folder creation');
}

// ----------------------------
// Serve static frontend files (HTML, CSS, JS)
// ----------------------------
const publicPath = path.join(__dirname); // HTML files are in root
app.use(express.static(publicPath));

// ----------------------------
// Frontend routes
// ----------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html')); // Homepage
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(publicPath, 'student.html')); // Student page
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html')); // Admin page
});

// ----------------------------
// API Routes
// ----------------------------
app.use('/api/student', require('./src/routes/student'));  // singular
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
