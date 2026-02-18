import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['admin', 'cashier', 'manager'], default: 'cashier' }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);