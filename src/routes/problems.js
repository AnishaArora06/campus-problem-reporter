// src/routes/problems.js
const express = require('express');
const Problem = require('../models/Problem'); // unified model name

const router = express.Router();

// ----------------------------
// POST /api/problems - Create new problem
// ----------------------------
router.post('/', async (req, res) => {
  try {
    const { title, description, category, status } = req.body || {};
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    const problem = await Problem.create({ title, description, category, status });
    res.status(201).json({ message: 'Problem created successfully', problem });
  } catch (err) {
    console.error('❌ Error creating problem:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------
// GET /api/problems - List all problems
// ----------------------------
router.get('/', async (_req, res) => {
  try {
    const problems = await Problem.find({}).sort({ createdAt: -1 });
    res.json({ count: problems.length, problems });
  } catch (err) {
    console.error('❌ Error fetching problems:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------
// PUT /api/problems/:id - Update problem
// ----------------------------
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    ['title', 'description', 'category', 'status'].forEach((f) => {
      if (req.body && typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    });

    const problem = await Problem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json({ message: 'Problem updated successfully', problem });
  } catch (err) {
    console.error('❌ Error updating problem:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------
// DELETE /api/problems/:id - Delete problem
// ----------------------------
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Problem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Problem not found' });
    res.json({ message: 'Problem deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting problem:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
