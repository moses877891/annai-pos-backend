import { Router } from 'express';
import Promotion from '../models/Promotion.js';
import { auth } from '../middleware/auth.js';
import { applyPromotionToCart } from '../utils/promoEngine.js';

const router = Router();

router.post('/apply', auth(), async (req, res) => {
  try {
    const { code, items = [] } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'No code' });

    const promo = await Promotion.findOne({ code: code.toUpperCase(), active: true });
    if (!promo) return res.json({ valid: false, message: 'Invalid promo code' });

    const result = await applyPromotionToCart(promo, items);
    if (!result.valid) return res.json({ valid: false, message: result.message });

    return res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      discountAmount: result.discountAmount,
      freeItems: result.freeItems,
      breakdown: result.breakdown,
      message: result.message
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

export default router;