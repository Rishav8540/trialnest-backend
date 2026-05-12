const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  category:      { type: String, required: true },
  description:   { type: String, required: true },
  price:         { type: Number, required: true, min: 0 },
  condition:     { type: String, default: 'New' },
  trialDuration: { type: String, default: '1 hour' },
  emoji:         { type: String, default: '📦' },
  images:        [{ type: String }],
  inStock:       { type: Boolean, default: true },
  stockCount:    { type: Number, default: 10 },
  sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName:    { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
