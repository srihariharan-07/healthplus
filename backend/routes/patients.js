const express  = require('express');
const router   = require('express').Router();
const Patient  = require('../models/Patient');
const auth     = require('../middleware/auth');

// SEARCH patients — GET /api/patients/search?q=john
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    const patients = await Patient.find({
      $or: [
        { name:      { $regex: query, $options: 'i' } },
        { patientId: { $regex: query, $options: 'i' } }
      ]
    }).select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE patient — PATCH /api/patients/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;