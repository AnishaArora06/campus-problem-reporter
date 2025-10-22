const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Problem = require('../models/Problem');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Multer storage for problem images (optional)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeExt = ext && ['.jpg', '.jpeg', '.png'].includes(ext.toLowerCase()) ? ext : '.jpg';
    cb(null, `problem_${Date.now()}_${Math.random().toString(36).slice(2,8)}${safeExt}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png'].includes(file.mimetype);
    if (!ok) return cb(new Error('Only jpg and png allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper: sign JWT
function signToken(id, role) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
}

// Basic field validation
function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj[f] || String(obj[f]).trim() === '');
  return missing;
}

// POST /api/students/register
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
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/students/login
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
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/students/problems (auth: student)
// Accepts multiple files via field name "images" (array) and legacy single "image"
router.post('/problems', auth('student'), upload.any(), async (req, res) => {
  try {
    const { title, description, category, imageUrl } = req.body || {};
    const missing = requireFields({ title, description, category }, ['title', 'description', 'category']);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

    const uploadedImages = [];
    if (Array.isArray(req.files)) {
      const files = req.files.filter(f => f.fieldname === 'images' || f.fieldname === 'image');
      for (const f of files) {
        uploadedImages.push(`/uploads/${f.filename}`);
      }
    }

    let primary = imageUrl;
    if (uploadedImages.length > 0) primary = uploadedImages[0];

    const problem = await Problem.create({
      title,
      description,
      category,
      imageUrl: primary,
      images: uploadedImages,
      reporter: req.user.id,
    });

    res.status(201).json({ problem });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Server error' });
  }
});

// GET /api/students/problems (auth: student)
router.get('/problems', auth('student'), async (req, res) => {
  try {
    const problems = await Problem.find({ reporter: req.user.id }).sort({ createdAt: -1 });
    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
