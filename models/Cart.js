const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:  { type: String },
  productPrice: { type: Number },
  productEmoji: { type: String },
  productImage: { type: String },
  sellerName:   { type: String },
  sellerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qty:          { type: Number, default: 1, min: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartItemSchema);
