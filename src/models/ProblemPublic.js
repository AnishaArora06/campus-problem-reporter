import mongoose from 'mongoose';

const PublicProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.models.PublicProblem || mongoose.model('PublicProblem', PublicProblemSchema);
