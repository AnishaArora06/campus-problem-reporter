const express = require('express');
const Problem = require('../models/Problem');

const router = express.Router();

// Public: GET /api/problems - recent problems for homepage
router.get('/problems', async (req, res) => {
  try {
    const { limit = 10, category, sort = 'desc' } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const problems = await Problem.find(filter)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 })
      .limit(Number(limit));

    res.json({ problems });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
