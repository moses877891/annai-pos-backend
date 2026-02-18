import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Seed admin (one-time helper)
/* POST /auth/seed-admin { username, password } */
router.post('/seed-admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'User exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, role: 'admin' });
    return res.json({ id: user._id, username: user.username, role: user.role });
  } catch (e) { return res.status(500).json({ message: e.message }); }
});

// Login
/* POST /auth/login { username, password } */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.json({ token, role: user.role, username });
  } catch (e) { return res.status(500).json({ message: e.message }); }
});

// Create cashier (admin only) — you can protect this later
/* POST /auth/create-cashier { username, password } */
router.post('/create-cashier', async (req, res) => {
  try {
    const { username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, role: 'cashier' });
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (e) { return res.status(500).json({ message: e.message }); }
});

// Create Manager
// Create Store Manager
router.post('/create-manager', auth('admin'), async (req, res) => {
  try {
    const { username, password } = req.body;

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      passwordHash,
      role: 'manager'
    });

    res.json({
      id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;