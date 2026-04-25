const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Trip = require('../models/Trip');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// POST /api/incidents — Create SOS or Warning
router.post('/', verifyToken, async (req, res) => {
  try {
    const { tripId, type, location, biometricSnapshot, notes } = req.body;

    const severity =
      type === 'SOS' ? 'critical' : type === 'Warning' ? 'high' : 'low';

    const incident = await Incident.create({
      userId: req.user.id,
      tripId,
      type,
      severity,
      location,
      biometricSnapshot,
      notes,
    });

    // Update trip alert level
    if (tripId) {
      const alertLevel = type === 'SOS' ? 'sos' : type === 'Warning' ? 'warning' : 'normal';
      await Trip.findByIdAndUpdate(tripId, { alertLevel, status: type === 'SOS' ? 'emergency' : 'active' });
    }

    const populated = await incident.populate('userId', 'name email avatarInitials');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/incidents — Admin: all incidents (paginated)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const incidents = await Incident.find()
      .populate('userId', 'name email avatarInitials')
      .populate('tripId', 'destinationLabel startTime')
      .sort({ triggeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/incidents/:id/resolve — Admin resolves incident
router.patch('/:id/resolve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        responderNotes: req.body.responderNotes || '',
      },
      { new: true }
    ).populate('userId', 'name email avatarInitials');
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/incidents/:id/acknowledge
router.patch('/:id/acknowledge', verifyToken, requireAdmin, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged' },
      { new: true }
    ).populate('userId', 'name email avatarInitials');
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
