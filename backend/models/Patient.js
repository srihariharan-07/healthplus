const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId:  { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  phone:      { type: String },
  dob:        { type: String },
  address:    { type: String },
  profilePic: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/147/147144.png' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);