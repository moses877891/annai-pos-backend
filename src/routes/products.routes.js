import { Router } from 'express';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// CREATE PRODUCT
router.post('/', auth('admin'), async (req, res) => {
  try {
    const prod = await Product.create(req.body);
    res.json(prod);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// LIST PRODUCTS
router.get('/', auth(), async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? { $or: [{ name: new RegExp(q, 'i') }, { code: Number(q) || -1 }] }
    : {};
  const items = await Product.find(filter).sort({ code: 1 });
  res.json(items);
});

// GET SINGLE PRODUCT
router.get('/:id', auth(), async (req, res) => {
  const prod = await Product.findById(req.params.id);
  if (!prod) return res.status(404).json({ message: "Not found" });
  res.json(prod);
});

// UPDATE PRODUCT
router.put('/:id', auth('admin'), async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(p);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE PRODUCT
router.delete('/:id', auth('admin'), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ADD VARIANT
router.post('/:id/variants', auth('admin'), async (req, res) => {
  try {
    const { name, price } = req.body;
    const prod = await Product.findById(req.params.id);

    prod.variants.push({ name, price });
    await prod.save();

    res.json(prod);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// EDIT VARIANT
router.put('/:id/variants/:variantId', auth('admin'), async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const { name, price } = req.body;

    const prod = await Product.findById(id);

    const variant = prod.variants.id(variantId);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    variant.name = name;
    variant.price = price;

    await prod.save();
    res.json(prod);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE VARIANT
router.delete('/:id/variants/:variantId', auth('admin'), async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    prod.variants.id(req.params.variantId).remove();
    await prod.save();

    res.json(prod);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;