const router = require('express').Router();
const Order  = require('../models/Order');
const Cart   = require('../models/Cart');
const Notif  = require('../models/Notif');
const protect = require('../middleware/auth');

// GET /api/orders/buyer
router.get('/buyer', protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/orders/seller
router.get('/seller', protect, async (req, res) => {
  try {
    const orders = await Order.find({ 'items.sellerId': req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/orders
router.post('/', protect, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, buyerId: req.user._id, buyerName: req.user.name });
    // Clear cart
    await Cart.deleteMany({ userId: req.user._id });
    // Notify seller
    const sellerId = req.body.items?.[0]?.sellerId;
    if (sellerId) {
      await Notif.create({
        userId: sellerId,
        title:  '🛒 New Order!',
        body:   `${req.user.name} ordered ₹${Number(req.body.total).toLocaleString('en-IN')}`,
        reqId:  order._id,
      });
    }
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
