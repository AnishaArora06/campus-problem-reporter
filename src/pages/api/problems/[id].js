import { connectDB } from '@/src/lib/db';
import Problem from '@/src/models/ProblemPublic';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await connectDB();
    if (req.method === 'PUT') {
      const updates = {};
      ['title', 'description', 'category', 'status'].forEach((f) => {
        if (req.body && typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
      });
      const doc = await Problem.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ problem: doc });
    }
    if (req.method === 'DELETE') {
      const deleted = await Problem.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error(`/api/problems/${id} error:`, err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
