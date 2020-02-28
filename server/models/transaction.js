import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  userIdTo: { type: Schema.Types.ObjectId, ref: 'User' },
  userIdFrom: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, default: null },
  tripId: { type: Schema.Types.ObjectId, ref: 'trip', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', TransactionSchema);
