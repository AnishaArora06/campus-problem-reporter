const express = require('express');
const RestProblem = require('../models/RestProblem');

const router = express.Router();

// POST /api/problems - create
router.post('/', async (req, res) => {
  try {
    const { title, description, category, status } = req.body || {};
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, category are required' });
    }
    const doc = await RestProblem.create({ title, description, category, status });
    res.status(201).json({ problem: doc });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/problems - list
router.get('/', async (_req, res) => {
  try {
    const problems = await RestProblem.find({}).sort({ createdAt: -1 });
    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/problems/:id - update
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    ['title', 'description', 'category', 'status'].forEach((f) => {
      if (req.body && typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    });
    const doc = await RestProblem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ problem: doc });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/problems/:id - delete
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RestProblem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
