const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Problem = require('../models/Problem');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper: sign JWT
function signToken(id, role) {
  const secret = process.env.JWT_SECRET || 'devsecret';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
}

function requireFields(obj, fields) {
  const missing = fields.filter((f) => !obj[f] || String(obj[f]).trim() === '');
  return missing;
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const missing = requireFields({ email, password }, ['email', 'password']);
    if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(', ')}` });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(admin._id, 'admin');
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/problems (auth: admin)
router.get('/problems', auth('admin'), async (req, res) => {
  try {
    const { status, category, sort = 'desc' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const problems = await Problem.find(filter)
      .populate('reporter', 'name email')
      .sort({ createdAt: sort === 'asc' ? 1 : -1 });

    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/problems/:id/status (auth: admin)
router.patch('/problems/:id/status', auth('admin'), async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['pending', 'in-progress', 'resolved'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    res.json({ problem });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/problems/:id (auth: admin) - edit fields
router.put('/problems/:id', auth('admin'), async (req, res) => {
  try {
    const updates = {};
    ['title', 'description', 'category', 'imageUrl', 'status'].forEach((f) => {
      if (req.body && typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    });

    const problem = await Problem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    res.json({ problem });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/problems/:id (auth: admin)
router.delete('/problems/:id', auth('admin'), async (req, res) => {
  try {
    const deleted = await Problem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Problem not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
