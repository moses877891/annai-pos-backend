import Product from '../models/Product.js';

/**
 * items: [{ code, name, qty, price, variantId?, variantName? }]
 * promo: Promotion mongoose doc
 * returns: { valid, message?, discountAmount, freeItems[], breakdown[] }
 */
export async function applyPromotionToCart(promo, items) {
  const result = { valid: false, message: 'Unknown', discountAmount: 0, freeItems: [], breakdown: [] };
  if (!promo?.active) { result.message = 'Promo inactive'; return result; }

  // Active window check (tolerant)
  const now = Date.now();
  const start = promo.startAt ? new Date(promo.startAt).getTime() : null;
  const end   = promo.endAt   ? new Date(promo.endAt).getTime()   : null;
  if (!((start === null || now >= start) && (end === null || now <= end))) {
    result.message = 'Promo not active (outside date range)';
    return result;
  }

  const cartSubtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const trig = promo.trigger || {};
  const rew  = promo.reward || {};

  // Helper matchers
  const byTrigger = async () => {
    if (trig.kind === 'ANY') return items;

    if (trig.kind === 'PRODUCT') {
      return items.filter(i => Number(i.code) === Number(trig.productCode));
    }

    if (trig.kind === 'CATEGORY') {
      // map code -> category
      const codes = [...new Set(items.map(i => i.code))];
      const prods = await Product.find({ code: { $in: codes } }).select('code category');
      const map = new Map(prods.map(p => [Number(p.code), p.category]));
      return items.filter(i => map.get(Number(i.code)) === trig.categoryName);
    }

    return [];
  }; 

  // PERCENT
  if (promo.type === 'PERCENT') {
    const min = Number(trig.minPurchase || 0);
    if (cartSubtotal < min) { result.message = `Min purchase ₹${min} not met`; return result; }
    const percent = Number(rew.percent || 0);
    const cap = (rew.maxDiscount != null) ? Number(rew.maxDiscount) : undefined;
    let d = cartSubtotal * percent / 100;
    if (cap != null) d = Math.min(d, cap);
    result.discountAmount = Math.round(d * 100) / 100;
    result.breakdown.push({ label: `${percent}% off`, amount: result.discountAmount });
    result.valid = true;
    result.message = 'Applied';
    return result;
  }

  // AMOUNT
  if (promo.type === 'AMOUNT') {
    const min = Number(trig.minPurchase || 0);
    if (cartSubtotal < min) { result.message = `Min purchase ₹${min} not met`; return result; }
    const amt = Number(rew.amount || 0);
    result.discountAmount = Math.round(amt * 100) / 100;
    result.breakdown.push({ label: `Flat ₹${amt} off`, amount: result.discountAmount });
    result.valid = true;
    result.message = 'Applied';
    return result;
  }

  // BOGO (same product free)
  if (promo.type === 'BOGO') {
    const eligible = await byTrigger();
    const buyQty = Number(rew.buyQty || 1);
    const getQty = Number(rew.getQty || 1);
    let totalFree = 0;

    const calcFree = (qty) => {
      if (buyQty <= 0 || getQty <= 0) return 0;
      const block = buyQty + getQty;
      const times = Math.floor(qty / block);
      return times * getQty;
    };

    for (const line of eligible) {
      const freeUnits = calcFree(line.qty);
      if (freeUnits > 0) {
        result.freeItems.push({
          code: line.code,
          name: line.name,
          variantId: line.variantId || null,
          variantName: line.variantName || null,
          qty: freeUnits,
          price: 0
        });
        totalFree += freeUnits;
      }
    }
    if (totalFree === 0) { result.message = `Not enough quantity for B${buyQty}G${getQty}`; return result; }
    result.breakdown.push({ label: `BOGO (Buy ${buyQty} Get ${getQty})`, amount: 0 });
    result.valid = true;
    result.message = 'Applied';
    return result;
  }

  // ITEM_FREE (reward a different product)
  if (promo.type === 'ITEM_FREE') {
    const eligible = await byTrigger();
    const haveQty = eligible.reduce((s, i) => s + i.qty, 0);
    const need = Number(trig.minQty || 1);
    if (haveQty < need) { result.message = `Need at least ${need} qualifying item(s)`; return result; }

    const rewardCode = Number(rew.rewardProductCode);
    const rewardQty  = Number(rew.rewardQty || 1);
    const rewardProd = await Product.findOne({ code: rewardCode }).select('name');
    if (!rewardProd) { result.message = 'Reward item not found'; return result; }

    result.freeItems.push({
      code: rewardCode,
      name: rewardProd.name,
      variantId: null,
      variantName: null,
      qty: rewardQty,
      price: 0
    });
    result.breakdown.push({ label: `Free item: ${rewardProd.name} x${rewardQty}`, amount: 0 });
    result.valid = true;
    result.message = 'Applied';
    return result;
  }

  result.message = 'Unsupported promo type';
  return result;
}