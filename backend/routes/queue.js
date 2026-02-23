const express = require('express');
const router  = express.Router();
const Queue   = require('../models/Queue');
const auth    = require('../middleware/auth');

router.get('/:doctorId', auth, async (req, res) => {
  try {
    const queue = await Queue.find({ doctorId: req.params.doctorId, status: { $ne: 'done' } })
      .populate('patientId', '-password')
      .sort('tokenNumber');
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patientId = req.user.id;
    const lastEntry = await Queue.findOne({ doctorId }).sort('-tokenNumber');
    const tokenNumber = lastEntry ? lastEntry.tokenNumber + 1 : 1;
    const entry = new Queue({ patientId, doctorId, tokenNumber });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const entry = await Queue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;