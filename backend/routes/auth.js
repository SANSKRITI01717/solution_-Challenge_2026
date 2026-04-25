const express   = require('express')
const router    = express.Router()
const jwt       = require('jsonwebtoken')
const Volunteer = require('../models/Volunteer')

const SECRET = process.env.JWT_SECRET || 'disaster_relief_secret'

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    req.volunteer = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, lat, lng, skill, organization } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const existing = await Volunteer.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const vol = new Volunteer({ name, email, password, phone, lat: lat || 22.7196, lng: lng || 75.8577, skill, organization })
    await vol.save()

    const token = jwt.sign({ id: vol._id, email: vol.email, skill: vol.skill }, SECRET, { expiresIn: '7d' })
    res.status(201).json({
      token,
      volunteer: { _id: vol._id, name: vol.name, email: vol.email, skill: vol.skill, available: vol.available }
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const vol = await Volunteer.findOne({ email }).populate('assignedZoneId')
    if (!vol) return res.status(400).json({ error: 'Invalid email or password' })

    const match = await vol.comparePassword(password)
    if (!match) return res.status(400).json({ error: 'Invalid email or password' })

    const token = jwt.sign({ id: vol._id, email: vol.email, skill: vol.skill }, SECRET, { expiresIn: '7d' })
    res.json({
      token,
      volunteer: {
        _id:            vol._id,
        name:           vol.name,
        email:          vol.email,
        skill:          vol.skill,
        available:      vol.available,
        assignedZoneId: vol.assignedZoneId,
        organization:   vol.organization,
        lat:            vol.lat,
        lng:            vol.lng,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me — get current volunteer profile + assignment
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const vol = await Volunteer.findById(req.volunteer.id)
      .populate('assignedZoneId')
      .select('-password')
    if (!vol) return res.status(404).json({ error: 'Not found' })
    res.json(vol)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/auth/complete-task — volunteer marks their own task done
router.patch('/complete-task', authMiddleware, async (req, res) => {
  try {
    const vol = await Volunteer.findById(req.volunteer.id)
    if (!vol) return res.status(404).json({ error: 'Not found' })
    if (vol.available) return res.status(400).json({ error: 'No active assignment' })

    const Assignment = require('../models/Assignment')
    // Complete the active assignment
    await Assignment.findOneAndUpdate(
      { volunteerId: vol._id, status: 'active' },
      { status: 'completed', completedAt: new Date() }
    )

    // Release volunteer
    vol.available      = true
    vol.assignedZoneId = null
    await vol.save()

    // Notify everyone
    req.io.emit('volunteer:released', {
      volunteerId: vol._id,
      message:     `${vol.name} completed their task and is now available`
    })

    res.json({ message: 'Task marked complete. You are now available.', volunteer: vol })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/auth/location — volunteer updates their GPS location
router.patch('/location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body
    const vol = await Volunteer.findByIdAndUpdate(
      req.volunteer.id,
      { lat, lng },
      { new: true }
    ).select('-password')
    res.json(vol)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = { router, authMiddleware }