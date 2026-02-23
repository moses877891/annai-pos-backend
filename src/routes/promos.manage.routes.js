import { Router } from "express";
import Promotion from "../models/Promotion.js";
import { auth } from "../middleware/auth.js";

const router = Router();


// CREATE
router.post("/", auth('manager'), async (req, res) => {
  try {
    const payload = normalizePromoBody(req.body);
    const promo = await Promotion.create(payload);
    return res.json(promo);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});

// LIST PROMOS
router.get("/", auth('manager'), async (req, res) => {
  const promos = await Promotion.find().sort({ createdAt: -1 });
  return res.json(promos);
});

// GET SINGLE PROMO
router.get("/:id", auth('manager'), async (req, res) => {
  const promo = await Promotion.findById(req.params.id);
  if (!promo) return res.status(404).json({ message: "Not found" });
  return res.json(promo);
});


// UPDATE
router.put("/:id", auth('manager'), async (req, res) => {
  try {
    const payload = normalizePromoBody(req.body);
    const updated = await Promotion.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    return res.json(updated);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
});


// DELETE PROMO
router.delete("/:id", auth('manager'), async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  return res.json({ ok: true });
});

function normalizePromoBody(body) {
  const b = JSON.parse(JSON.stringify(body)); // shallow clone plain

  // Coerce empty dates to null; convert valid strings to Date
  const toDateOrNull = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  };
  b.startAt = toDateOrNull(b.startAt);
  b.endAt   = toDateOrNull(b.endAt);

  // Coerce booleans
  if (typeof b.active === 'string') b.active = (b.active === 'true');

  // Ensure nested objects exist
  b.trigger = b.trigger || {};
  b.reward  = b.reward  || {};

  // Coerce numbers safely
  const num = (v, def = 0) => (v === '' || v === undefined || v === null ? def : Number(v));
  b.trigger.minPurchase     = num(b.trigger.minPurchase, 0);
  b.trigger.minQty          = num(b.trigger.minQty, 1);
  b.trigger.productCode     = b.trigger.productCode ? Number(b.trigger.productCode) : undefined;

  b.reward.percent          = b.reward.percent       !== '' ? Number(b.reward.percent)      : undefined;
  b.reward.amount           = b.reward.amount        !== '' ? Number(b.reward.amount)       : undefined;
  b.reward.maxDiscount      = b.reward.maxDiscount   !== '' ? Number(b.reward.maxDiscount)  : undefined;
  b.reward.buyQty           = b.reward.buyQty        !== '' ? Number(b.reward.buyQty)       : undefined;
  b.reward.getQty           = b.reward.getQty        !== '' ? Number(b.reward.getQty)       : undefined;
  b.reward.rewardQty        = b.reward.rewardQty     !== '' ? Number(b.reward.rewardQty)    : undefined;
  b.reward.rewardProductCode= b.reward.rewardProductCode ? Number(b.reward.rewardProductCode) : undefined;

  // Clean empty strings that should be undefined
  if (b.trigger.kind !== 'PRODUCT')   delete b.trigger.productCode;
  if (b.trigger.kind !== 'CATEGORY')  delete b.trigger.categoryName;

  return b;
}

export default router;