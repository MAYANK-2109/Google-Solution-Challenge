const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Trip = require('../models/Trip');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const TONE_PROMPTS = {
  guardian: 'You are a caring big brother/sister figure. Write a short, warm 1-2 line safety check-in message asking if the traveller is doing okay. Be protective and reassuring. Do NOT use any markdown formatting.',
  friendly: 'You are a cheerful, respectful friend. Write a short, warm 1-2 line safety check-in message asking if the traveller is safe. Be lighthearted and kind. Do NOT use any markdown formatting.',
  playful: 'You are a witty, slightly flirty but always respectful companion. Write a short, charming 1-2 line safety check-in message asking if the traveller is okay. Keep it tasteful and fun. Do NOT use any markdown formatting.',
};

// POST /api/checkin/generate-message — Generate a Gemini check-in message
router.post('/generate-message', verifyToken, async (req, res) => {
  try {
    const tones = ['guardian', 'friendly', 'playful'];
    const tone = req.body.tone || tones[Math.floor(Math.random() * tones.length)];
    const prompt = TONE_PROMPTS[tone] || TONE_PROMPTS.friendly;

    let message = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      message = response.text().trim();
    } catch (aiErr) {
      // Fallback messages if Gemini is unavailable
      const fallbacks = {
        guardian: "Hey, just checking in on you! Everything okay on your end? Remember, I'm watching over you. Stay safe! 🛡️",
        friendly: "Hi there! Quick check — are you doing alright? Just making sure everything's smooth on your journey! 😊",
        playful: "Hey you! Still out there conquering the world? Just wanted to make sure you're safe and sound! ✨",
      };
      message = fallbacks[tone] || fallbacks.friendly;
    }

    res.json({ message, tone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/checkin/confirm — Traveller confirms they are okay
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ message: 'tripId is required' });

    await Trip.findByIdAndUpdate(tripId, { lastCheckInAt: new Date() });
    res.json({ message: 'Check-in confirmed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
