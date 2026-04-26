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
// Temporary seed route — remove after seeding
router.post('/seed-data', async (req, res) => {
  try {
    const Volunteer = require('../models/Volunteer')
    
    await Zone.deleteMany({})
    await Volunteer.deleteMany({})

    const calcPriority = (s, p) => s * 0.5 + Math.log(p + 1) * 0.3 + (s / 10) * 0.2

    const zones = await Zone.insertMany([
      { name: 'Flood Zone A – Riverside',    lat: 22.7196, lng: 75.8577, severity: 9, peopleAffected: 5000, requiredSkill: 'rescue',    needsHelp: true, priorityScore: calcPriority(9,5000) },
      { name: 'Earthquake – Old City',       lat: 22.7250, lng: 75.8700, severity: 8, peopleAffected: 2000, requiredSkill: 'medical',   needsHelp: true, priorityScore: calcPriority(8,2000) },
      { name: 'Landslide – Hill Station',    lat: 22.7400, lng: 75.8900, severity: 7, peopleAffected: 300,  requiredSkill: 'rescue',    needsHelp: true, priorityScore: calcPriority(7,300)  },
      { name: 'Fire Zone – Industrial Area', lat: 22.7100, lng: 75.8400, severity: 6, peopleAffected: 800,  requiredSkill: 'logistics', needsHelp: true, priorityScore: calcPriority(6,800)  },
      { name: 'Cyclone – Coastal Area',      lat: 22.6900, lng: 75.8200, severity: 8, peopleAffected: 3500, requiredSkill: 'medical',   needsHelp: true, priorityScore: calcPriority(8,3500) },
    ])

    await Volunteer.insertMany([
      { name: 'Arjun Mehta',  lat: 22.7180, lng: 75.8560, skill: 'rescue',    available: true, organization: 'Red Cross' },
      { name: 'Priya Sharma', lat: 22.7260, lng: 75.8720, skill: 'medical',   available: true, organization: 'AIIMS Mobile' },
      { name: 'Ravi Kumar',   lat: 22.7090, lng: 75.8390, skill: 'logistics', available: true, organization: 'NGO Seva' },
      { name: 'Neha Singh',   lat: 22.7380, lng: 75.8880, skill: 'rescue',    available: true, organization: 'NDRF' },
      { name: 'Amit Patel',   lat: 22.7300, lng: 75.8600, skill: 'medical',   available: true, organization: 'PHC Indore' },
      { name: 'Sunita Rao',   lat: 22.6950, lng: 75.8250, skill: 'logistics', available: true, organization: 'Relief Corps' },
      { name: 'Vikram Joshi', lat: 22.7150, lng: 75.8650, skill: 'rescue',    available: true, organization: 'SDRF' },
      { name: 'Kavya Nair',   lat: 22.7320, lng: 75.8780, skill: 'medical',   available: true, organization: 'NGO Asha' },
    ])

    res.json({ success: true, message: '✅ Seeded 5 zones and 8 volunteers!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
module.exports = router;
