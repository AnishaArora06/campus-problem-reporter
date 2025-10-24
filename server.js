require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/db');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Ensure uploads directory exists and serve static files (only locally)
if (process.env.VERCEL !== '1') {
  const uploadsDir = path.join(__dirname, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
} else {
  console.log('Running on Vercel - skipping uploads directory creation');
}

// Serve static frontend files (HTML, CSS, JS)
const publicPath = path.join(__dirname); // 👈 assuming index.html, student.html, admin.html are in root folder
app.use(express.static(publicPath));

// Handle frontend routes (Student/Admin portals)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(publicPath, 'student.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});

// API Routes
app.use('/api/students', require('./src/routes/student'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api', require('./src/routes/public'));
app.use('/api/problems', require('./src/routes/problems'));

// Health check
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || mongoose.connection.readyState;
  res.json({ status: 'ok', db: dbState });
});

const PORT = process.env.PORT || 5000;

// Start server after DB connects
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
