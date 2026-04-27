const Trip = require('../models/Trip');
const Incident = require('../models/Incident');

// Track HR spike duration per user: { userId: { startTime, lastHR } }
const hrSpikeTracker = {};
const HR_THRESHOLD = 120;
const SPIKE_DURATION_MS = 30000; // 30 seconds

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── User joins their trip room ──────────────────────────────
    socket.on('join-trip', ({ tripId, userId }) => {
      socket.join(`trip-${tripId}`);
      socket.tripId = tripId;
      socket.userId = userId;
      console.log(`👤 User ${userId} joined trip-${tripId}`);
    });

    // ── Admin joins the admin broadcast room ────────────────────
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log(`🛡️  Admin joined admin-room`);
    });

    // ── Live location update from user ──────────────────────────
    socket.on('location-update', async ({ tripId, userId, lat, lng }) => {
      try {
        // Persist to DB (throttled — only every 5th call in prod to keep DB lean)
        await Trip.findByIdAndUpdate(tripId, {
          currentLocation: { lat, lng },
          $push: { locationHistory: { lat, lng, timestamp: new Date() } },
        });

        // Broadcast to admin room
        io.to('admin-room').emit('user-location', { tripId, userId, lat, lng, timestamp: Date.now() });
      } catch (err) {
        console.error('location-update error:', err.message);
      }
    });

    // ── Biometric update from user ──────────────────────────────
    socket.on('biometric-update', async ({ tripId, userId, hr, source }) => {
      try {
        await Trip.findByIdAndUpdate(tripId, {
          currentHR: hr,
          $push: { biometricLog: { hr, source: source || 'simulated', timestamp: new Date() } },
        });

        // Broadcast to admin room
        io.to('admin-room').emit('user-biometric', { tripId, userId, hr, source: source || 'simulated', timestamp: Date.now() });

        // ── Crisis threshold logic ──────────────────────────────
        if (hr > HR_THRESHOLD) {
          if (!hrSpikeTracker[userId]) {
            hrSpikeTracker[userId] = { startTime: Date.now(), lastHR: hr };
          } else {
            const elapsed = Date.now() - hrSpikeTracker[userId].startTime;
            if (elapsed >= SPIKE_DURATION_MS) {
              // Auto-create Warning incident
              const trip = await Trip.findById(tripId);
              if (trip && trip.alertLevel === 'normal') {
                const incident = await Incident.create({
                  userId,
                  tripId,
                  type: 'Warning',
                  severity: 'high',
                  biometricSnapshot: { hr },
                  location: trip.currentLocation,
                  notes: `Auto-triggered: HR ${hr} BPM sustained >30s`,
                });
                await Trip.findByIdAndUpdate(tripId, { alertLevel: 'warning' });

                const populated = await incident.populate('userId', 'name email avatarInitials');
                io.to('admin-room').emit('new-incident', populated);
                // Notify user in trip room
                io.to(`trip-${tripId}`).emit('crisis-alert', {
                  type: 'Warning',
                  message: `⚠️ Elevated heart rate detected (${hr} BPM). Security has been notified.`,
                });
              }
              delete hrSpikeTracker[userId];
            }
          }
        } else {
          // Reset tracker if HR normalizes
          delete hrSpikeTracker[userId];
        }
      } catch (err) {
        console.error('biometric-update error:', err.message);
      }
    });

    // ── SOS triggered by user ───────────────────────────────────
    socket.on('sos-trigger', async ({ tripId, userId, lat, lng, hr }) => {
      try {
        // SOS Deduplication: check if user already has an active SOS
        const existingActive = await Incident.findOne({
          userId,
          type: 'SOS',
          status: { $in: ['open', 'acknowledged'] },
        });
        if (existingActive) {
          socket.emit('sos-duplicate', {
            message: 'Your SOS is already active. Security is responding.',
          });
          return;
        }

        const incident = await Incident.create({
          userId,
          tripId,
          type: 'SOS',
          severity: 'critical',
          location: { lat, lng },
          biometricSnapshot: { hr },
          notes: 'Manual SOS triggered by user',
        });

        await Trip.findByIdAndUpdate(tripId, {
          alertLevel: 'sos',
          status: 'emergency',
        });

        const populated = await incident.populate('userId', 'name email avatarInitials');

        // Blast to ALL admins with high-priority flag
        io.to('admin-room').emit('sos-alert', { incident: populated, tripId, userId });
        // Echo back to user's room
        io.to(`trip-${tripId}`).emit('crisis-alert', {
          type: 'SOS',
          message: '🚨 SOS sent! Security team has been alerted and is responding.',
        });

        delete hrSpikeTracker[userId];
        console.log(`🚨 SOS from user ${userId} on trip ${tripId}`);
      } catch (err) {
        console.error('sos-trigger error:', err.message);
      }
    });

    // ── Admin responds to a user ────────────────────────────────
    socket.on('admin-response', ({ tripId, message, adminName }) => {
      io.to(`trip-${tripId}`).emit('admin-message', {
        message,
        adminName,
        timestamp: Date.now(),
      });
      console.log(`📢 Admin response to trip-${tripId}: ${message}`);
    });

    // ── User sends message to Admin via QuickCall ──────────────────────────────
    socket.on('admin-notification', ({ tripId, message, type }) => {
      io.to('admin-room').emit('admin-notification', { tripId, userId: socket.userId, message, type, timestamp: Date.now() });
      console.log(`💬 User notification to admin from trip-${tripId}: ${message}`);
    });

    // ── Admin resolves alert (clears user UI) ───────────────────
    socket.on('resolve-alert', async ({ tripId, userId }) => {
      try {
        await Trip.findByIdAndUpdate(tripId, { alertLevel: 'normal', status: 'active' });
        io.to(`trip-${tripId}`).emit('alert-resolved', {
          message: '✅ Security team has resolved your alert. Stay safe!',
        });
        io.to('admin-room').emit('alert-cleared', { tripId, userId });
      } catch (err) {
        console.error('resolve-alert error:', err.message);
      }
    });

    // ── Admin acknowledges incident → notify traveller ──────────
    socket.on('incident-acknowledged', ({ tripId, adminName }) => {
      io.to(`trip-${tripId}`).emit('sos-acknowledged', {
        message: `🛡️ Security (${adminName || 'Team'}) has acknowledged your alert and is responding.`,
        adminName,
        timestamp: Date.now(),
      });
      console.log(`✅ Admin acknowledged incident on trip-${tripId}`);
    });

    // ── User confirms check-in → notify admin ───────────────────
    socket.on('checkin-ok', ({ tripId, userId }) => {
      io.to('admin-room').emit('checkin-ok', { tripId, userId, timestamp: Date.now() });
      console.log(`✅ User ${userId} confirmed check-in on trip-${tripId}`);
    });

    // ── Disconnect ──────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.userId) delete hrSpikeTracker[socket.userId];
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
