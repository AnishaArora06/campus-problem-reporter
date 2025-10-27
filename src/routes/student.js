const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Problem = require('../models/Problem');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ===================== MULTER CONFIGURATION =====================
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const validExt = ['.jpg', '.jpeg', '.png'];
    const safeExt = validExt.includes(ext) ? ext : '.jpg';
    cb(null, `problem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG and PNG images are allowed'));
    }
    cb(null, true);
  },
});

// ===================== JWT HELPER =====================
function signToken(id, role) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
}

// ===================== HELPER FUNCTION =====================
function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj[f] || String(obj[f]).trim() === '');
  return missing;
}

// ===================== REGISTER =====================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const missing = requireFields({ name, email, password }, ['name', 'email', 'password']);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

    const exists = await Student.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const student = await Student.create({ name, email, password });
    const token = signToken(student._id, 'student');
    res.status(201).json({ token, student: { id: student._id, name: student.name, email: student.email } });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== LOGIN =====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const missing = requireFields({ email, password }, ['email', 'password']);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await student.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(student._id, 'student');
    res.json({ token, student: { id: student._id, name: student.name, email: student.email } });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== SUBMIT PROBLEM (MAIN FIX) =====================
// Frontend FormData field name: 'images' or 'imageUpload'
router.post('/report', upload.array('images', 5), async (req, res) => {
  try {
    const {
      studentName,
      rollNumber,
      department,
      category,
      location,
      problemDescription,
      priority,
    } = req.body || {};

    const missing = requireFields(
      { studentName, rollNumber, department, category, location, problemDescription, priority },
      ['studentName', 'rollNumber', 'department', 'category', 'location', 'problemDescription', 'priority']
    );
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

    const newProblem = await Problem.create({
      studentName,
      rollNumber,
      department,
      category,
      location,
      problemDescription,
      priority,
      images: imagePaths,
      status: 'Pending',
    });

    res.status(201).json({
      message: 'Problem submitted successfully!',
      problem: newProblem,
    });
  } catch (err) {
    console.error('Error submitting problem:', err.message);
    res.status(500).json({ message: 'Failed to submit problem' });
  }
});

// ===================== GET STUDENT PROBLEMS =====================
router.get('/problems', async (req, res) => {
  try {
    const problems = await Problem.find().sort({ createdAt: -1 });
    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
