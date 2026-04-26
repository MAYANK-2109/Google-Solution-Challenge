const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Trip = require('../models/Trip');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash');

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

// POST /api/incidents/:id/audio — Upload and analyze audio
router.post('/:id/audio', verifyToken, upload.single('audio'), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    let aiRiskReport = '';

    // Build prompt with all available telemetry
    const hr = incident.biometricSnapshot?.hr || 'unknown';
    const loc = incident.location
      ? `${Number(incident.location.lat).toFixed(4)}, ${Number(incident.location.lng).toFixed(4)}`
      : 'unknown';
    const basePrompt = `You are an emergency response AI assisting security personnel. An SOS alert was triggered. User heart rate: ${hr} BPM. Location: ${loc}. `;

    // Check if we have real audio (not the empty fallback blob)
    const hasAudio = req.file && req.file.size > 100;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      let result;

      if (hasAudio) {
        const audioData = {
          inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype || 'audio/webm',
          },
        };
        const prompt = basePrompt + `Analyze the attached audio clip: the tone, words spoken, and background noise. Provide a 2-3 line concise risk report.`;
        result = await model.generateContent([prompt, audioData]);
      } else {
        const prompt = basePrompt + `No audio was captured (microphone was unavailable). Based solely on the biometric and SOS trigger data, provide a 2-3 line concise risk assessment and recommended action for security.`;
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      aiRiskReport = response.text();
    } catch (aiErr) {
      console.warn('Gemini API failed, using fallback assessment:', aiErr.message);
      const hrNum = incident.biometricSnapshot?.hr || 80;
      if (hrNum > 120) {
        aiRiskReport = `⚠️ HIGH RISK: Biometric telemetry shows severe physiological stress (${hrNum} BPM). SOS was manually triggered. Immediate dispatch of security personnel is strongly recommended. User may be in physical danger.`;
      } else {
        aiRiskReport = `🟡 MODERATE RISK: SOS button was deliberately held by the user (${hrNum} BPM HR). Physical danger is possible. Contact user immediately via QuickCall to verify safety before escalating.`;
      }
    }


    incident.aiRiskReport = aiRiskReport;
    await incident.save();

    const populated = await incident.populate('userId', 'name email avatarInitials');

    // Emit to admins so their dashboard updates
    if (req.io) {
      req.io.to('admin-room').emit('incident-updated', populated);
    }

    res.json({ message: 'Audio analyzed successfully', aiRiskReport });
  } catch (err) {
    console.error('Audio Analysis Error:', err);
    res.status(500).json({ message: 'Failed to analyze audio' });
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
router.patch('/:id/resolve', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
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

    // Emit to admins so their dashboard updates
    if (req.io) {
      req.io.to('admin-room').emit('incident-updated', incident);
    }

    res.json(incident);
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/incidents/:id/acknowledge
router.patch('/:id/acknowledge', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged' },
      { new: true }
    ).populate('userId', 'name email avatarInitials');

    if (req.io) {
      req.io.to('admin-room').emit('incident-updated', incident);
    }

    res.json(incident);
  } catch (err) {
    console.error('Acknowledge error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
