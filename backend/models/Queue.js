const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  tokenNumber: { type: Number, required: true },
  status:      { type: String, enum: ['waiting', 'serving', 'done'], default: 'waiting' },
  complaint:   { type: String, default: '' },
  symptoms:    { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Queue', queueSchema);