const router  = require('express').Router();
const Request = require('../models/Request');
const Notif   = require('../models/Notif');
const protect = require('../middleware/auth');

// GET /api/requests/buyer
router.get('/buyer', protect, async (req, res) => {
  try {
    const requests = await Request.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/requests/seller
router.get('/seller', protect, async (req, res) => {
  try {
    const requests = await Request.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/requests
router.post('/', protect, async (req, res) => {
  try {
    const request = await Request.create({ ...req.body, buyerId: req.user._id, buyerName: req.user.name });
    await Notif.create({
      userId: req.body.sellerId,
      title:  '🔔 New Trial Request',
      body:   `${req.user.name} wants to trial "${req.body.productName}" on ${req.body.date} at ${req.body.slot}`,
      reqId:  request._id,
    });
    res.status(201).json(request);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/requests/:id/action  (seller: accept/reject)
router.patch('/:id/action', protect, async (req, res) => {
  try {
    const { action } = req.body;
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user._id },
      { status: action },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Not found' });
    await Notif.create({
      userId: request.buyerId,
      title:  action === 'accepted' ? '🎉 Trial Accepted!' : '❌ Trial Rejected',
      body:   action === 'accepted'
        ? `Your trial for "${request.productName}" on ${request.date} at ${request.slot} is confirmed!`
        : `Sorry, your request for "${request.productName}" was declined.`,
      reqId:  request._id,
    });
    res.json(request);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/requests/:id/decision  (buyer: bought/cancelled)
router.patch('/:id/decision', protect, async (req, res) => {
  try {
    const { decision } = req.body;
    const request = await Request.findOneAndUpdate(
      { _id: req.params.id, buyerId: req.user._id },
      { buyerDecision: decision, decidedAt: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Not found' });
    await Notif.create({
      userId: request.sellerId,
      title:  decision === 'bought' ? '🎉 Purchase Confirmed!' : 'Trial Cancelled',
      body:   `${req.user.name} ${decision === 'bought' ? 'purchased' : 'cancelled after trialling'} "${request.productName}"`,
      reqId:  request._id,
    });
    res.json(request);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
