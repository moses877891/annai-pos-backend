import { Router } from 'express';
import Category from '../models/Category.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// CREATE CATEGORY
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const cat = await Category.create({ name, description });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// LIST CATEGORIES
router.get('/', auth(), async (req, res) => {
  const data = await Category.find().sort({ name: 1 });
  res.json(data);
});

export default router;