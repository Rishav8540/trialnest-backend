const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:     { type: String, required: true },
  senderRole:     { type: String, enum: ['buyer', 'seller'], required: true },
  text:           { type: String, required: true, trim: true, maxlength: 2000 },
  read:           { type: Boolean, default: false },
}, { timestamps: true });

// conversationId format: "buyerId_sellerId_productId"
// This makes it easy to look up all messages for a specific buyer-seller-product combo

module.exports = mongoose.model('Message', messageSchema);
