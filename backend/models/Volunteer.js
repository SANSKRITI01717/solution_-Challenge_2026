const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const VolunteerSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, unique: true, sparse: true },
  password:       { type: String, default: null }, // optional for admin-added volunteers
  phone:          { type: String, default: '' },
  lat:            { type: Number, required: true },
  lng:            { type: Number, required: true },
  skill:          { type: String, enum: ['medical','rescue','logistics'], required: true },
  available:      { type: Boolean, default: true },
  assignedZoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', default: null },
  organization:   { type: String, default: '' },
}, { timestamps: true })

// Only hash if password exists and was modified
VolunteerSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

VolunteerSchema.methods.comparePassword = async function(plain) {
  if (!this.password) return false
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('Volunteer', VolunteerSchema)