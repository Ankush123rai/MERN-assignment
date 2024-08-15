import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: { type: Date, required: true },
    category: String,
    sold: Boolean
  });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
