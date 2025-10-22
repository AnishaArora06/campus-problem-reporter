const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String }, // primary image (if any)
    images: [{ type: String }], // additional image URLs (optional)
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Problem', problemSchema);
