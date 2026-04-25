const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  volunteerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  zoneId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  distanceKm:   { type: Number },
  skill:        { type: String },
  status:       { type: String, enum: ['active','completed','cancelled'], default: 'active' },
  assignedAt:   { type: Date, default: Date.now },
  completedAt:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
