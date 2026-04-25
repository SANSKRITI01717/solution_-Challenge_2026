const express    = require('express');
const router     = express.Router();
const Zone       = require('../models/Zone');
const Volunteer  = require('../models/Volunteer');
const Assignment = require('../models/Assignment');
const { runEngine } = require('../utils/engineBridge');
const { scheduleRelease } = require('../utils/autoRelease');

/**
 * POST /api/match
 * Runs the C++ greedy allocation engine.
 * Saves assignments to MongoDB and broadcasts via Socket.IO.
 */
router.post('/', async (req, res) => {
  try {
    // Fetch all active zones and available volunteers from DB
    const zones      = await Zone.find({ needsHelp: true });
    const volunteers = await Volunteer.find({ available: true });

    if (zones.length === 0)      return res.status(400).json({ error: 'No active disaster zones' });
    if (volunteers.length === 0) return res.status(400).json({ error: 'No available volunteers' });

    // Shape data for C++ engine
    const engineInput = {
      zones: zones.map(z => ({
        id:             z._id.toString(),
        name:           z.name,
        lat:            z.lat,
        lng:            z.lng,
        severity:       z.severity,
        peopleAffected: z.peopleAffected,
        requiredSkill:  z.requiredSkill,
        needsHelp:      z.needsHelp,
      })),
      volunteers: volunteers.map(v => ({
        id:        v._id.toString(),
        name:      v.name,
        lat:       v.lat,
        lng:       v.lng,
        skill:     v.skill,
        available: v.available,
      })),
    };

    // ─── Call C++ engine ───
    const result = await runEngine(engineInput);

    // Persist assignments to MongoDB
    const savedAssignments = [];
    for (const a of result.assignments) {
      // Update volunteer as assigned
      await Volunteer.findByIdAndUpdate(a.volunteerId, {
        available:      false,
        assignedZoneId: a.zoneId,
      });

      // Save assignment record
      const aDoc = await Assignment.create({
        volunteerId: a.volunteerId,
        zoneId:      a.zoneId,
        distanceKm:  a.distanceKm,
        skill:       a.skill,
      });
      savedAssignments.push(aDoc);
      // Auto-release volunteer after task duration
      scheduleRelease(aDoc, req.io);
    }

    // Update zone priority scores from engine output
    for (const z of result.prioritizedZones) {
      await Zone.findByIdAndUpdate(z.id, { priorityScore: z.priorityScore });
    }

    // Broadcast to all connected clients
    req.io.emit('match:complete', {
      assignments:       savedAssignments,
      prioritizedZones:  result.prioritizedZones,
      volunteerStatus:   result.volunteerStatus,
      stats:             result.stats,
    });

    res.json({
      message:     'Matching complete',
      assignments: savedAssignments,
      stats:       result.stats,
      prioritizedZones: result.prioritizedZones,
    });

  } catch (err) {
    console.error('Match error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET all assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('volunteerId', 'name skill')
      .populate('zoneId', 'name severity')
      .sort({ assignedAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH complete an assignment
router.patch('/:id/complete', async (req, res) => {
  try {
    const a = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );
    // Release volunteer
    await Volunteer.findByIdAndUpdate(a.volunteerId, {
      available: true, assignedZoneId: null
    });
    req.io.emit('assignment:completed', a);
    res.json(a);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
