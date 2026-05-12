const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:  { type: String, required: true },
  productPrice: { type: Number, required: true },
  productEmoji: { type: String, default: '📦' },
  productImage: { type: String, default: '' },
  sellerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName:   { type: String, required: true },
  buyerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:    { type: String, required: true },
  buyerPhone:   { type: String, default: '' },
  trialType:    { type: String, enum: ['home', 'store'], required: true },
  date:         { type: String, required: true },
  slot:         { type: String, required: true },
  duration:     { type: String, required: true },
  address:      { type: String, default: '' },
  status:       { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  buyerDecision:{ type: String, enum: ['bought', 'cancelled', null], default: null },
  decidedAt:    { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
