import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  userEmail: { type: String, default: null },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userType: { type: String, default: 'rider' },
  stripeAccountId: { type: String, default: null },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Wallet', WalletSchema);
