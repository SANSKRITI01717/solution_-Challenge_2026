const express = require('express');
const router  = express.Router();
const Zone    = require('../models/Zone');

// GET all zones (sorted by priority)
router.get('/', async (req, res) => {
  try {
    const zones = await Zone.find().sort({ priorityScore: -1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single zone
router.get('/:id', async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(zone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create zone
router.post('/', async (req, res) => {
  try {
    const { name, lat, lng, severity, peopleAffected, requiredSkill, description } = req.body;
    // Calculate priority score (mirrors C++ logic)
    const peopleFactor = peopleAffected > 0 ? Math.log(peopleAffected + 1) * 0.3 : 0;
    const priorityScore = severity * 0.5 + peopleFactor + (severity / 10) * 0.2;

    const zone = new Zone({
      name, lat, lng, severity, peopleAffected,
      requiredSkill, description, priorityScore, needsHelp: true
    });
    await zone.save();

    // Emit real-time event
    req.io.emit('zone:new', zone);
    res.status(201).json(zone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update zone
router.put('/:id', async (req, res) => {
  try {
    if (req.body.severity || req.body.peopleAffected) {
      const s = req.body.severity || 5;
      const p = req.body.peopleAffected || 0;
      req.body.priorityScore = s * 0.5 + Math.log(p + 1) * 0.3 + (s / 10) * 0.2;
    }
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    req.io.emit('zone:updated', zone);
    res.json(zone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE zone
router.delete('/:id', async (req, res) => {
  try {
    await Zone.findByIdAndDelete(req.params.id);
    req.io.emit('zone:deleted', { id: req.params.id });
    res.json({ message: 'Zone deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
