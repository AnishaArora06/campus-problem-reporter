const mongoose = require('mongoose');

const restProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.RestProblem || mongoose.model('RestProblem', restProblemSchema);
