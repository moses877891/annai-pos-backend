// annai-pos-backend/src/models/Promotion.js
import mongoose from 'mongoose';

// ---- Safe coercers (centralized) ----
const toNumberOrUndef = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const toDateOrNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

// ---- Sub-schemas ----
const TriggerSchema = new mongoose.Schema({
  kind: { type: String, enum: ['ANY', 'PRODUCT', 'CATEGORY'], default: 'ANY' },

  // Only relevant when kind === 'PRODUCT'
  productCode: {
    type: Number,
    set: toNumberOrUndef
  },

  // Only relevant when kind === 'CATEGORY'
  categoryName: { type: String },

  // For BOGO / item_free minimum qualifying quantity
  minQty: {
    type: Number,
    default: 1,
    set: toNumberOrUndef
  },

  // For amount/percent min purchase threshold (₹)
  minPurchase: {
    type: Number,
    default: 0,
    set: toNumberOrUndef
  }
}, { _id: false });

const RewardSchema = new mongoose.Schema({
  // 'DISCOUNT' is used for Percent/Amount. Others use SAME_PRODUCT_FREE / ITEM_FREE
  type: {
    type: String,
    enum: ['DISCOUNT', 'SAME_PRODUCT_FREE', 'ITEM_FREE'],
    required: true
  },

  // Discount fields (when type === 'DISCOUNT')
  percent: { type: Number, set: toNumberOrUndef },
  amount: { type: Number, set: toNumberOrUndef },
  maxDiscount: { type: Number, set: toNumberOrUndef },

  // BOGO fields (when SAME_PRODUCT_FREE)
  buyQty: { type: Number, set: toNumberOrUndef },
  getQty: { type: Number, set: toNumberOrUndef },

  // ITEM_FREE fields
  rewardProductCode: { type: Number, set: toNumberOrUndef },
  rewardQty: { type: Number, set: toNumberOrUndef }
}, { _id: true });

const PromotionSchema = new mongoose.Schema({
  code: { type: String, unique: true, index: true },
  type: { type: String, enum: ['PERCENT', 'AMOUNT', 'BOGO', 'ITEM_FREE'], required: true },
  active: { type: Boolean, default: true },

  // Dates are optional; empty or invalid becomes null (treated as open-ended)
  startAt: { type: Date, set: toDateOrNull, default: null },
  endAt:   { type: Date, set: toDateOrNull, default: null },

  trigger: { type: TriggerSchema, default: () => ({}) },
  reward:  { type: RewardSchema, required: true },

  note: String
}, { timestamps: true });

export default mongoose.model('Promotion', PromotionSchema);