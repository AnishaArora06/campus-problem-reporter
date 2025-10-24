import { connectDB } from "../../lib/db";
import Problem from "../../models/ProblemPublic";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    await connectDB();
    const { title, description, category } = req.body || {};
    if (!title || !description || !category) return res.status(400).json({ error: 'title, description, category are required' });

    const doc = await Problem.create({ title, description, category });
    return res.status(201).json({ problem: doc });
  } catch (err) {
    console.error('POST /api/report error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
