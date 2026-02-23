const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  visitId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  medicineName: { type: String, required: true },
  dosage:       { type: String },
  duration:     { type: String },
  startDate:    { type: String },
  dosesTaken:   { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);