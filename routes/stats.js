const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Incident = require('../models/Incident');
const Trip = require('../models/Trip');

/**
 * GET /api/stats
 * Public endpoint — returns real live platform statistics.
 */
router.get('/', async (req, res) => {
  try {
    const [totalTravelers, totalIncidents, resolvedIncidents, activeTrips] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'resolved' }),
      Trip.countDocuments({ status: 'active' }),
    ]);

    res.json({
      totalTravelers,
      totalIncidents,
      resolvedIncidents,
      activeTrips,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
