import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true },    // Quarter, Half, Full
  price: { type: Number, required: true }
}, { _id: true });

const ProductSchema = new mongoose.Schema({
  code: { type: Number, unique: true, index: true },
  name: { type: String, index: 'text' },
  category: String,

  // Base price optional if variants exist
  price: Number,

  variants: [VariantSchema],  // <── NEW

  taxEnabled: { type: Boolean, default: false },
  taxRate: { type: Number, default: 0 },

  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);