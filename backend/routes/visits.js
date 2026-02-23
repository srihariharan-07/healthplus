const express      = require('express');
const router       = express.Router();
const Visit        = require('../models/Visit');
const Prescription = require('../models/Prescription');
const auth         = require('../middleware/auth');

router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.params.patientId }).sort('-visitDate');
    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:visitId/prescriptions', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ visitId: req.params.visitId });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:visitId/prescriptions', auth, async (req, res) => {
  try {
    const prescription = new Prescription({ ...req.body, visitId: req.params.visitId });
    await prescription.save();
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/prescriptions/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;