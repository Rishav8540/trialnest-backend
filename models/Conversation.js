const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  buyerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:      { type: String, required: true },
  sellerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName:     { type: String, required: true },
  productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:    { type: String, required: true },
  productEmoji:   { type: String, default: '📦' },
  lastMessage:    { type: String, default: '' },
  lastMessageAt:  { type: Date, default: Date.now },
  unreadBuyer:    { type: Number, default: 0 },
  unreadSeller:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
