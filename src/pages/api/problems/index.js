import { connectDB } from "../../../lib/db";
import Problem from "../../../models/ProblemPublic";

export default async function handler(req, res) {
  try {
    await connectDB();
    if (req.method === 'GET') {
      const problems = await Problem.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ problems });
    }
    if (req.method === 'POST') {
      const { title, description, category, status } = req.body || {};
      if (!title || !description || !category) return res.status(400).json({ error: 'title, description, category are required' });
      const doc = await Problem.create({ title, description, category, status });
      return res.status(201).json({ problem: doc });
    }
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('/api/problems error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
