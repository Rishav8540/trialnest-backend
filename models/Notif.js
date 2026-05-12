const mongoose = require('mongoose');

const notifSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:  { type: String, required: true },
  body:   { type: String, required: true },
  reqId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  read:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notif', notifSchema);
