import mongoose from 'mongoose';

const LineItemSchema = new mongoose.Schema({
    code: Number,
    name: String,
    qty: Number,

    // Unit price at time of sale (kept as `price` for compatibility)
    price: Number,

    // NEW: optional variant info (for things like Quarter / Half / Full)
    variantId: { type: mongoose.Schema.Types.ObjectId, required: false },
    variantName: { type: String, required: false },

    // Reserved for GST future
    taxAmount: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
    invoiceNo: { type: String, unique: true, index: true },
    datetime: { type: Date, default: Date.now, index: true },
    items: [LineItemSchema],
    subTotal: Number,
    taxTotal: { type: Number, default: 0 },
    grandTotal: Number,
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card'], default: 'Cash' },
    cashier: { type: String },

    discountTotal: { type: Number, default: 0 },    // <— NEW
    promoCode: { type: String },                    // <— NEW
    promoBreakdown: [{ label: String, amount: Number }], // <— NEW

    status: { type: String, enum: ['Created', 'Cancelled'], default: 'Created', index: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancelReason: { type: String }
}, { timestamps: true });

export default mongoose.model('Sale', SaleSchema);