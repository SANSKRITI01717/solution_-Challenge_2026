/**
 * seed.js — run once to populate MongoDB with sample data
 * Usage: node seed.js
 */
require('dotenv').config()
const mongoose  = require('mongoose')
const Zone      = require('./models/Zone')
const Volunteer = require('./models/Volunteer')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-relief'

const calcPriority = (severity, people) => {
  const pf = people > 0 ? Math.log(people + 1) * 0.3 : 0
  return severity * 0.5 + pf + (severity / 10) * 0.2
}

const zones = [
  { name: 'Flood Zone A – Riverside',    lat: 22.7196, lng: 75.8577, severity: 9, peopleAffected: 5000, requiredSkill: 'rescue',    needsHelp: true },
  { name: 'Earthquake – Old City',       lat: 22.7250, lng: 75.8700, severity: 8, peopleAffected: 2000, requiredSkill: 'medical',   needsHelp: true },
  { name: 'Landslide – Hill Station',    lat: 22.7400, lng: 75.8900, severity: 7, peopleAffected: 300,  requiredSkill: 'rescue',    needsHelp: true },
  { name: 'Fire Zone – Industrial Area', lat: 22.7100, lng: 75.8400, severity: 6, peopleAffected: 800,  requiredSkill: 'logistics', needsHelp: true },
  { name: 'Cyclone – Coastal Area',      lat: 22.6900, lng: 75.8200, severity: 8, peopleAffected: 3500, requiredSkill: 'medical',   needsHelp: true },
].map(z => ({ ...z, priorityScore: calcPriority(z.severity, z.peopleAffected) }))

const volunteers = [
  { name: 'Arjun Mehta',    lat: 22.7180, lng: 75.8560, skill: 'rescue',    available: true,  organization: 'Red Cross' },
  { name: 'Priya Sharma',   lat: 22.7260, lng: 75.8720, skill: 'medical',   available: true,  organization: 'AIIMS Mobile' },
  { name: 'Ravi Kumar',     lat: 22.7090, lng: 75.8390, skill: 'logistics', available: true,  organization: 'NGO Seva' },
  { name: 'Neha Singh',     lat: 22.7380, lng: 75.8880, skill: 'rescue',    available: true,  organization: 'NDRF' },
  { name: 'Amit Patel',     lat: 22.7300, lng: 75.8600, skill: 'medical',   available: true,  organization: 'PHC Indore' },
  { name: 'Sunita Rao',     lat: 22.6950, lng: 75.8250, skill: 'logistics', available: true,  organization: 'Relief Corps' },
  { name: 'Vikram Joshi',   lat: 22.7150, lng: 75.8650, skill: 'rescue',    available: true,  organization: 'SDRF' },
  { name: 'Kavya Nair',     lat: 22.7320, lng: 75.8780, skill: 'medical',   available: true,  organization: 'NGO Asha' },
]

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log('Connected to MongoDB')

  await Zone.deleteMany({})
  await Volunteer.deleteMany({})

  await Zone.insertMany(zones)
  await Volunteer.insertMany(volunteers)

  console.log(`✅ Seeded ${zones.length} zones and ${volunteers.length} volunteers`)
  await mongoose.disconnect()
}

seed().catch(err => { console.error(err); process.exit(1) })
