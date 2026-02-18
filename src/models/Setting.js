import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  restaurantName: String,
  address: String,
  phone: String,
  gstin: String,
  invoicePrefix: { type: String, default: 'ANN' },
  gstEnabled: { type: Boolean, default: false } // future toggle
}, { timestamps: true });

export default mongoose.model('Setting', SettingSchema);