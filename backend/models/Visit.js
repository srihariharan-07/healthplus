const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  visitDate:    { type: String },
  followUpDate: { type: String },
  notes:        { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);