const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const protect = require('../middleware/auth');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields required.' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered.' });
    const user  = await User.create({ name, email, password, role });
    const token = signToken(user._id);
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, paymentInfo: user.paymentInfo } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: 'Invalid email or password.' });
    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, paymentInfo: user.paymentInfo } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/seller/:id/payment  — public seller payment info for buyers at checkout
router.get('/seller/:id/payment', protect, async (req, res) => {
  try {
    const seller = await User.findById(req.params.id).select('name paymentInfo role');
    if (!seller || seller.role !== 'seller')
      return res.status(404).json({ message: 'Seller not found' });
    res.json({ name: seller.name, paymentInfo: seller.paymentInfo });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/auth/payment
router.put('/payment', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { paymentInfo: req.body.paymentInfo },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
