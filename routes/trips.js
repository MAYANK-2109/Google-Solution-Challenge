const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /api/trips/start — User starts a new trip
router.post('/start', verifyToken, async (req, res) => {
  try {
    // End any previously active trips
    await Trip.updateMany({ userId: req.user.id, status: 'active' }, { status: 'completed', endTime: new Date() });

    const trip = await Trip.create({
      userId: req.user.id,
      destinationLabel: req.body.destinationLabel || 'Campus Area',
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/trips/:id/end — User ends a trip
router.patch('/:id/end', verifyToken, async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'completed', endTime: new Date(), alertLevel: 'normal' },
      { new: true }
    );
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trips/active — Admin: all currently active trips with user info
router.get('/active', verifyToken, requireAdmin, async (req, res) => {
  try {
    const trips = await Trip.find({ status: 'active' })
      .populate('userId', 'name email phone avatarInitials')
      .sort({ startTime: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trips/my — User: their own trips
router.get('/my', verifyToken, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ startTime: -1 }).limit(20);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trips/:id — Full trip detail
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('userId', 'name email avatarInitials');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
