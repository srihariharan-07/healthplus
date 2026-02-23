const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Patient  = require('../models/Patient');
const Doctor   = require('../models/Doctor');

router.post('/register', async (req, res) => {
  try {
    const { patientId, name, email, password, phone, dob, address } = req.body;
    const exists = await Patient.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const patient = new Patient({ patientId, name, email, password: hashed, phone, dob, address });
    await patient.save();
    const token = jwt.sign({ id: patient._id, role: 'patient' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: patient, role: 'patient' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/patient-login', async (req, res) => {
  try {
    const { patientId, email, password } = req.body;
    const patient = await Patient.findOne({ patientId, email });
    if (!patient) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: patient._id, role: 'patient' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: patient, role: 'patient' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/doctor-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: doctor._id, role: 'doctor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: doctor, role: 'doctor' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;