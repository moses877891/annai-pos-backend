import { Router } from 'express';
import Sale from '../models/Sale.js';
import { auth } from '../middleware/auth.js';
import dayjs from 'dayjs';

const router = Router();

// Daily sales: today 00:00 -> 23:59
router.get('/daily', auth(), async (req, res) => {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();

  const [agg] = await Sale.aggregate([
    { $match: { datetime: { $gte: start, $lte: end }, status: "Created" } },
    { $group: { _id: null, amount: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
  ]);

  res.json({ total: agg?.amount || 0, bills: agg?.count || 0 });
});

// YESTERDAY SALES
router.get('/yesterday', auth(), async (req, res) => {
  const start = dayjs().subtract(1, 'day').startOf('day').toDate();
  const end = dayjs().subtract(1, 'day').endOf('day').toDate();

  const [agg] = await Sale.aggregate([
    { $match: { datetime: { $gte: start, $lte: end }, status: "Created" } },
    { $group: { _id: null, amount: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
  ]);

  res.json({
    total: agg?.amount || 0,
    bills: agg?.count || 0,
    date: dayjs(start).format("DD-MMM-YYYY")
  });
});

// Monthly sales: current month
router.get('/monthly', auth(), async (req, res) => {
  const start = dayjs().startOf('month').toDate();
  const end = dayjs().endOf('month').toDate();

  const [agg] = await Sale.aggregate([
    { $match: { datetime: { $gte: start, $lte: end }, status: "Created" } },
    { $group: { _id: null, amount: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
  ]);

  res.json({ total: agg?.amount || 0, bills: agg?.count || 0 });
});

// Top items (current month)
router.get('/top-items', auth(), async (req, res) => {
  const start = dayjs().startOf('month').toDate();
  const end = dayjs().endOf('month').toDate();

  const agg = await Sale.aggregate([
    { $match: { datetime: { $gte: start, $lte: end }, status: "Created" } },
    { $unwind: "$items" },
    { $group: { _id: { code: "$items.code", name: "$items.name" }, qty: { $sum: "$items.qty" }, amount: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
    { $sort: { qty: -1 } },
    { $limit: 10 }
  ]);

  res.json(agg.map(x => ({ code: x._id.code, name: x._id.name, qty: x.qty, amount: x.amount })));
});

// CANCELLED ORDER SUMMARY (Today)
router.get("/cancelled", auth(), async (req, res) => {
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const cancelled = await Sale.find({
    datetime: { $gte: start, $lte: end },
    status: "Cancelled"
  }).select("invoiceNo datetime grandTotal paymentMode cancelReason");

  res.json({
    count: cancelled.length,
    list: cancelled
  });
});

export default router;