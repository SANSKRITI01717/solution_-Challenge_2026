const express   = require('express');
const router    = express.Router();
const Volunteer = require('../models/Volunteer');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.available) filter.available = req.query.available === 'true';
    if (req.query.skill)     filter.skill     = req.query.skill;
    const vols = await Volunteer.find(filter).populate('assignedZoneId', 'name');
    res.json(vols);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vol = await Volunteer.findById(req.params.id).populate('assignedZoneId');
    if (!vol) return res.status(404).json({ error: 'Volunteer not found' });
    res.json(vol);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const vol = new Volunteer(req.body);
    await vol.save();
    req.io.emit('volunteer:registered', vol);
    res.status(201).json(vol);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const vol = await Volunteer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vol) return res.status(404).json({ error: 'Volunteer not found' });
    req.io.emit('volunteer:updated', vol);
    res.json(vol);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mark volunteer as available again (task complete)
router.patch('/:id/release', async (req, res) => {
  try {
    const vol = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { available: true, assignedZoneId: null },
      { new: true }
    );
    req.io.emit('volunteer:released', vol);
    res.json(vol);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
