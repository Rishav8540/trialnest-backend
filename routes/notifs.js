const router = require('express').Router();
const Notif  = require('../models/Notif');
const protect = require('../middleware/auth');

// GET /api/notifs
router.get('/', protect, async (req, res) => {
  try {
    const notifs = await Notif.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json(notifs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/notifs/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    await Notif.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /api/notifs/read-all
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notif.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
