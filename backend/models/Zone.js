const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  lat:             { type: Number, required: true },
  lng:             { type: Number, required: true },
  severity:        { type: Number, min: 1, max: 10, required: true },
  peopleAffected:  { type: Number, default: 0 },
  requiredSkill:   { type: String, enum: ['medical','rescue','logistics','any'], default: 'any' },
  needsHelp:       { type: Boolean, default: true },
  priorityScore:   { type: Number, default: 0 },
  description:     { type: String, default: '' },
  reportedBy:      { type: String, default: 'field-officer' },
}, { timestamps: true });

module.exports = mongoose.model('Zone', ZoneSchema);
