const router = require('express').Router();
const Cart   = require('../models/Cart');
const protect = require('../middleware/auth');

// GET /api/cart
router.get('/', protect, async (req, res) => {
  try {
    const items = await Cart.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/cart  (add item)
router.post('/', protect, async (req, res) => {
  try {
    const { productId, productName, productPrice, productEmoji, productImage, sellerName, sellerId, qty = 1 } = req.body;
    let item = await Cart.findOne({ userId: req.user._id, productId });
    if (item) {
      item.qty += qty;
      await item.save();
    } else {
      item = await Cart.create({ userId: req.user._id, productId, productName, productPrice, productEmoji, productImage, sellerName, sellerId, qty });
    }
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/cart/:productId  (update qty)
router.patch('/:productId', protect, async (req, res) => {
  try {
    const { qty } = req.body;
    if (qty <= 0) {
      await Cart.findOneAndDelete({ userId: req.user._id, productId: req.params.productId });
      return res.json({ message: 'Removed' });
    }
    const item = await Cart.findOneAndUpdate(
      { userId: req.user._id, productId: req.params.productId },
      { qty },
      { new: true }
    );
    res.json(item);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/cart/:productId
router.delete('/:productId', protect, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user._id, productId: req.params.productId });
    res.json({ message: 'Removed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
