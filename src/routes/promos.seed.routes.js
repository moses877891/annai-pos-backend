// annai-pos-backend/src/routes/promos.seed.routes.js
import { Router } from 'express';
import Promotion from '../models/Promotion.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/seed', auth('admin'), async (req, res) => {
  await Promotion.deleteMany({});

  await Promotion.create([
    // 10% off on any cart, cap ₹100
    {
      code: 'DIWALI10',
      type: 'PERCENT',
      trigger: { kind: 'ANY', minPurchase: 0 },
      reward: { type: 'DISCOUNT', percent: 10, maxDiscount: 100 },
      note: '10% off up to ₹100'
    },
    // ₹50 off on min purchase ₹500
    {
      code: 'FLAT50',
      type: 'AMOUNT',
      trigger: { kind: 'ANY', minPurchase: 500 },
      reward: { type: 'DISCOUNT', amount: 50 },
      note: 'Flat ₹50 off on ₹500+'
    },
    // B1G1 on product code 401 (Chicken Tandoori, same variant)
    {
      code: 'B1G1-TANDOORI',
      type: 'BOGO',
      trigger: { kind: 'PRODUCT', productCode: 401, minQty: 1 },
      reward: { type: 'SAME_PRODUCT_FREE', buyQty: 1, getQty: 1 },
      note: 'Buy 1 Get 1 on Chicken Tandoori'
    },
    // Buy any Fried Rice → get Coke (code 9001) free
    {
      code: 'RICE-COKE',
      type: 'ITEM_FREE',
      trigger: { kind: 'CATEGORY', categoryName: 'Fried Rice', minQty: 1 },
      reward: { type: 'ITEM_FREE', rewardProductCode: 9001, rewardQty: 1 },
      note: 'Buy any Fried Rice, get 1 Coke free'
    }
  ]);

  res.json({ ok: true });
});
export default router;
