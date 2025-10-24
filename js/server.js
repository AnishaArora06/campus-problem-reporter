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

// ✅ Serve frontend static files (like index.html, css, js, images)
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists and serve static files
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/students', require('./src/routes/student'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api', require('./src/routes/public'));

// Health check
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || mongoose.connection.readyState;
  res.json({ status: 'ok', db: dbState });
});

// ✅ Serve index.html as the homepage (this fixes your Render issue)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;

// Start server after DB connects
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Homepage: http://localhost:${PORT}`);
      console.log(`👩‍🎓 Student: http://localhost:${PORT}/student.html`);
      console.log(`🧑‍💻 Admin: http://localhost:${PORT}/admin.html`);
      console.log(`💚 Health: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
