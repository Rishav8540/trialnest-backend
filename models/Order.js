const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:  { type: String },
  productPrice: { type: Number },
  productEmoji: { type: String },
  productImage: { type: String },
  sellerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerName:   { type: String },
  qty:          { type: Number, default: 1 },
});

const orderSchema = new mongoose.Schema({
  orderId:        { type: String, unique: true },
  buyerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:      { type: String, required: true },
  items:          [orderItemSchema],
  address:        { type: String },
  phone:          { type: String },
  paymentMethod:  { type: String },
  transactionRef: { type: String, default: '' },
  subtotal:       { type: Number },
  shipping:       { type: Number },
  total:          { type: Number },
  status:         { type: String, enum: ['confirmed','processing','shipped','delivered','cancelled'], default: 'confirmed' },
  sellerPayment:  { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'ORD-' + Math.random().toString(36).toUpperCase().slice(2, 10);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
