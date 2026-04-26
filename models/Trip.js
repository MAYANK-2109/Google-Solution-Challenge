const mongoose = require('mongoose');

const locationPointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const biometricPointSchema = new mongoose.Schema(
  {
    hr: { type: Number, required: true }, // heart rate BPM
    source: { type: String, enum: ['simulated', 'ble'], default: 'simulated' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'completed', 'emergency'], default: 'active' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    destinationLabel: { type: String, default: 'Campus Area' },
    locationHistory: [locationPointSchema],
    biometricLog: [biometricPointSchema],
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    currentHR: { type: Number, default: 70 },
    alertLevel: { type: String, enum: ['normal', 'warning', 'sos'], default: 'normal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
