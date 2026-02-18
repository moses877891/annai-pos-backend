import { Router } from 'express';
import Sale from '../models/Sale.js';
import { auth } from '../middleware/auth.js';
import Promotion from '../models/Promotion.js';
import Product from '../models/Product.js'
import { applyPromotionToCart } from '../utils/promoEngine.js';

const router = Router();

function nextInvoiceNo(prefix, seq) {
  return `${prefix}-${String(seq).padStart(6,'0')}`;
}

/* POST /sales  { items:[{code,name,qty,price}], paymentMode, invoicePrefix } */

// Add a helper to call the same logic from promo route (or re-call the endpoint internally)
// For brevity, we’ll re-query the promo and do minimal repeat logic here.


router.post('/', auth(), async (req, res) => {
  const { items = [], paymentMode = 'Cash', invoicePrefix = 'ANN', promoCode } = req.body;

  const subTotal = items.reduce((s,i)=>s + (i.price*i.qty), 0);
  let discountTotal = 0;
  let promoBreakdown = [];
  let freeItems = [];
  let appliedCode = null;

  if (promoCode) {
    const promo = await Promotion.findOne({ code: String(promoCode).toUpperCase(), active: true });
    if (promo) {
      const applied = await applyPromotionToCart(promo, items);
      if (applied.valid) {
        discountTotal = applied.discountAmount || 0;
        promoBreakdown = applied.breakdown || [];
        freeItems = applied.freeItems || [];
        appliedCode = promo.code;
      }
    }
  }

  const taxTotal = 0; // GST off for now
  const grandTotal = Math.max(0, Math.round((subTotal - discountTotal + taxTotal) * 100) / 100);

  // ... invoice no generation (keep your existing code)
  const last = await Sale.findOne().sort({ createdAt: -1 });
  const lastSeq = last?.invoiceNo?.split('-')?.[1] ? Number(last.invoiceNo.split('-')[1]) : 0;
  const invoiceNo = nextInvoiceNo(invoicePrefix, lastSeq + 1);

  const doc = await Sale.create({
    invoiceNo,
    items: [...items, ...freeItems],
    subTotal,
    taxTotal,
    grandTotal,
    paymentMode,
    cashier: req.user?.username,
    status: 'Created',
    discountTotal,
    promoCode: appliedCode,
    promoBreakdown
  });

  res.json(doc);
});


// LIST receipts (default status=Created), paginated
// GET /sales?status=Created&limit=100&skip=0
// LIST receipts (default status=Created), paginated
router.get('/', auth(), async (req, res) => {
  const status = req.query.status || 'Created';
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const skip = Number(req.query.skip) || 0;

  const sales = await Sale.find({ status })
    .sort({ datetime: -1 })
    .skip(skip)
    .limit(limit)
    .select('invoiceNo datetime paymentMode subTotal discountTotal promoCode grandTotal status');
    res.json(sales);
});

// VIEW a single receipt by invoice number
// GET /sales/:invoiceNo
router.get('/:invoiceNo', auth(), async (req, res) => {
  const sale = await Sale.findOne({ invoiceNo: req.params.invoiceNo });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  res.json(sale);
});

// CANCEL a receipt (sets status = Cancelled)
// PATCH /sales/:invoiceNo/cancel { reason?: string }
router.patch('/:invoiceNo/cancel', auth(), async (req, res) => {
  const sale = await Sale.findOne({ invoiceNo: req.params.invoiceNo });
  if (!sale) return res.status(404).json({ message: 'Sale not found' });
  if (sale.status === 'Cancelled') {
    return res.status(400).json({ message: 'Sale already cancelled' });
  }

  sale.status = 'Cancelled';
  sale.cancelledAt = new Date();
  sale.cancelledBy = req.user?.username || 'system';
  sale.cancelReason = req.body?.reason || null;
  await sale.save();

  res.json({ ok: true, invoiceNo: sale.invoiceNo, status: sale.status });
});

export default router;