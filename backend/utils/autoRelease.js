/**
 * autoRelease.js
 * Automatically releases volunteers after they complete their task.
 * Release time is based on zone severity:
 *   Severity 1-3  → 2 minutes  (demo friendly)
 *   Severity 4-6  → 4 minutes
 *   Severity 7-8  → 6 minutes
 *   Severity 9-10 → 8 minutes
 *
 * In real world these would be hours, but for demo we use minutes
 * so judges can SEE volunteers becoming available again live.
 */

const Assignment = require('../models/Assignment')
const Volunteer  = require('../models/Volunteer')
const Zone       = require('../models/Zone')

function getReleaseTimeMs(severity) {
  if (severity >= 9) return 8 * 60 * 1000   // 8 minutes
  if (severity >= 7) return 6 * 60 * 1000   // 6 minutes
  if (severity >= 4) return 4 * 60 * 1000   // 4 minutes
  return 2 * 60 * 1000                       // 2 minutes
}

async function scheduleRelease(assignment, io) {
  try {
    // Get zone severity
    const zone = await Zone.findById(assignment.zoneId)
    if (!zone) return

    const releaseMs = getReleaseTimeMs(zone.severity)

    setTimeout(async () => {
      try {
        // Mark assignment as completed
        const updated = await Assignment.findByIdAndUpdate(
          assignment._id,
          { status: 'completed', completedAt: new Date() },
          { new: true }
        )
        if (!updated) return

        // Release volunteer back to available pool
        await Volunteer.findByIdAndUpdate(assignment.volunteerId, {
          available:      true,
          assignedZoneId: null
        })

        // Notify all clients via Socket.IO
        io.emit('volunteer:released', {
          volunteerId: assignment.volunteerId,
          zoneId:      assignment.zoneId,
          zoneName:    zone.name,
          message:     `Volunteer completed task at ${zone.name} — now available`
        })

        io.emit('assignment:completed', updated)

        console.log(`Auto-released volunteer ${assignment.volunteerId} from ${zone.name}`)
      } catch (err) {
        console.error('Auto-release error:', err.message)
      }
    }, releaseMs)

    console.log(`Scheduled release for assignment ${assignment._id} in ${releaseMs / 60000} minutes`)
  } catch (err) {
    console.error('Schedule release error:', err.message)
  }
}

module.exports = { scheduleRelease }
