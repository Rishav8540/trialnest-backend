const router       = require('express').Router();
const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');
const protect      = require('../middleware/auth');

// GET /api/chat/conversations — get all conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role   = req.user.role;

    const query = role === 'buyer'
      ? { buyerId:  userId }
      : { sellerId: userId };

    const convos = await Conversation.find(query)
      .sort({ lastMessageAt: -1 });
    res.json(convos);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/chat/messages/:conversationId — get message history
router.get('/messages/:conversationId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/chat/conversations/start — start or get a conversation
router.post('/conversations/start', protect, async (req, res) => {
  try {
    const { sellerId, sellerName, productId, productName, productEmoji } = req.body;
    if (req.user.role !== 'buyer')
      return res.status(403).json({ message: 'Only buyers can start conversations' });

    const conversationId = `${req.user._id}_${sellerId}_${productId}`;

    let convo = await Conversation.findOne({ conversationId });
    if (!convo) {
      convo = await Conversation.create({
        conversationId,
        buyerId:    req.user._id,
        buyerName:  req.user.name,
        sellerId,
        sellerName,
        productId,
        productName,
        productEmoji: productEmoji || '📦',
      });
    }
    res.json(convo);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/chat/unread — total unread count for current user
router.get('/unread', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role   = req.user.role;
    const field  = role === 'buyer' ? 'unreadBuyer' : 'unreadSeller';
    const query  = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };

    const convos = await Conversation.find(query).select(field);
    const total  = convos.reduce((sum, c) => sum + (c[field] || 0), 0);
    res.json({ total });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
