const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    type: { type: String, enum: ['SOS', 'Warning', 'Normal'], default: 'Normal' },
    severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'low' },
    triggeredAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    notes: { type: String, default: '' },
    responderNotes: { type: String, default: '' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    biometricSnapshot: {
      hr: { type: Number },
    },
    aiRiskReport: { type: String, default: '' },
    audioData: { type: String },
    audioMimeType: { type: String, default: 'audio/webm' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
