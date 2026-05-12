const router  = require('express').Router();
const Product = require('../models/Product');
const protect = require('../middleware/auth');

// GET /api/products — all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/products/seller — seller's own products
router.get('/seller', protect, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/products
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ message: 'Sellers only' });
    const product = await Product.create({
      ...req.body,
      sellerId:   req.user._id,
      sellerName: req.user.name,
    });
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/products/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { ...req.body, sellerName: req.user.name },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Not found or not yours' });
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Not found or not yours' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/products/:id/toggle-stock
router.patch('/:id/toggle-stock', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Not found' });
    product.inStock = !product.inStock;
    await product.save();
    res.json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
