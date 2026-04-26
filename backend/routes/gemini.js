// const express = require('express')
// const router  = express.Router()
// const { GoogleGenerativeAI } = require('@google/generative-ai')

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// // ── Retry helper — waits and retries if quota hit ──
// async function generateWithRetry(model, prompt, retries = 3) {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const result = await model.generateContent(prompt)
//       return result.response.text().trim()
//     } catch (err) {
//       const isQuota = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many')
//       if (isQuota && i < retries - 1) {
//         console.log(`Quota hit, waiting 10 seconds... (attempt ${i + 1}/${retries})`)
//         await new Promise(r => setTimeout(r, 10000)) // wait 10 seconds
//         continue
//       }
//       throw err
//     }
//   }
// }

// // ── Demo fallback data (used if Gemini completely unavailable) ──
// function getZoneFallback(zone) {
//   const level = zone.priorityScore >= 7 ? 'CRITICAL' : zone.priorityScore >= 5 ? 'HIGH' : 'MEDIUM'
//   return {
//     situationSummary: `${zone.name} is a ${level.toLowerCase()} disaster zone with severity ${zone.severity}/10 affecting ${zone.peopleAffected?.toLocaleString()} people. Immediate ${zone.requiredSkill} response is required to prevent further casualties.`,
//     immediateActions: [
//       `Deploy ${zone.requiredSkill} teams to ${zone.name} immediately`,
//       `Establish emergency communication center at nearest safe location`,
//       `Begin evacuation of most vulnerable populations first`
//     ],
//     suppliesNeeded: [
//       zone.requiredSkill === 'medical' ? 'Medical kits and medicines' : 'Rescue equipment',
//       'Emergency food and water (3-day supply)',
//       'Temporary shelter materials'
//     ],
//     riskLevel: level,
//     timeToAct: level === 'CRITICAL' ? 'Immediate — within 30 minutes' : 'Urgent — within 2 hours',
//     volunteerAdequacy: `Current volunteer assignment may be insufficient for ${zone.peopleAffected} affected people. Additional ${zone.requiredSkill} volunteers recommended.`,
//     prediction: `Without immediate intervention, the situation at ${zone.name} could escalate significantly within 6 hours, potentially doubling the number of people at risk.`
//   }
// }

// function getReportFallback(zones, assignments) {
//   const totalAffected = zones.reduce((s, z) => s + (z.peopleAffected || 0), 0)
//   const topZone = zones.sort((a, b) => b.priorityScore - a.priorityScore)[0]
//   return {
//     overallStatus: zones.some(z => z.priorityScore >= 7) ? 'CRITICAL' : 'HIGH',
//     executiveSummary: `Active disaster response operation covering ${zones.length} zones with ${totalAffected.toLocaleString()} total people affected. ${assignments.length} volunteer assignments are currently active. Immediate coordination required across all zones.`,
//     topPriority: `${topZone?.name} — highest priority score of ${topZone?.priorityScore?.toFixed(2)} with ${topZone?.peopleAffected} people affected`,
//     resourceGaps: [
//       'Additional medical volunteers needed for high-severity zones',
//       'Food and water supplies running low in flood areas',
//       'Communication infrastructure needs reinforcement'
//     ],
//     immediateRecommendations: [
//       'Prioritize rescue operations in zones with severity 8+',
//       'Coordinate with local NGOs for additional volunteer support',
//       'Set up emergency supply distribution centers',
//       'Establish real-time communication between all zone commanders'
//     ],
//     coordinationNotes: `All ${zones.length} zone commanders should maintain hourly check-ins. Resource sharing between nearby zones is recommended to optimize response efficiency.`,
//     nextSixHours: `Expect situation to remain critical for the next 6 hours. Weather conditions and aftershocks may affect rescue operations. Maintain reserve volunteer capacity of at least 20%.`,
//     successMetrics: [
//       'Reduction in unassigned critical zones to zero',
//       'All affected people reached within 4 hours',
//       'Zero volunteer idle time in active zones'
//     ]
//   }
// }

// // ── Single zone AI insight ──
// router.post('/zone-insight', async (req, res) => {
//   try {
//     const { zone, assignments } = req.body
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

//     const prompt = `
// You are an expert disaster response coordinator. Analyze this disaster zone and give a concise actionable report.

// DISASTER ZONE DATA:
// - Name: ${zone.name}
// - Severity: ${zone.severity}/10
// - People Affected: ${zone.peopleAffected}
// - Required Skill: ${zone.requiredSkill}
// - Priority Score: ${zone.priorityScore?.toFixed(2)}
// - Volunteers Assigned: ${assignments?.length || 0}

// Respond in this EXACT JSON format (no markdown, no backticks, just raw JSON):
// {
//   "situationSummary": "2-3 sentence summary of the situation",
//   "immediateActions": ["action 1", "action 2", "action 3"],
//   "suppliesNeeded": ["supply 1", "supply 2", "supply 3"],
//   "riskLevel": "CRITICAL or HIGH or MEDIUM or LOW",
//   "timeToAct": "e.g. Immediate - within 1 hour",
//   "volunteerAdequacy": "Are current volunteers enough? One sentence.",
//   "prediction": "What happens in next 6 hours if no action taken? One sentence."
// }
// `
//     const text  = await generateWithRetry(model, prompt)
//     const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
//     const parsed = JSON.parse(clean)
//     res.json({ success: true, insight: parsed, zoneName: zone.name, source: 'gemini' })

//   } catch (err) {
//     console.log('Gemini unavailable, using smart fallback:', err.message)
//     // Return smart fallback so UI never breaks
//     res.json({
//       success: true,
//       insight: getZoneFallback(req.body.zone),
//       zoneName: req.body.zone?.name,
//       source: 'fallback'
//     })
//   }
// })

// // ── Full situation report ──
// router.post('/situation-report', async (req, res) => {
//   try {
//     const { zones, volunteers, assignments, stats } = req.body
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

//     const zonesSummary = zones.map(z =>
//       `- ${z.name}: severity ${z.severity}/10, ${z.peopleAffected} affected, needs ${z.requiredSkill}, priority ${z.priorityScore?.toFixed(2)}`
//     ).join('\n')

//     const assignSummary = assignments.map(a =>
//       `- ${a.volunteerId?.name || 'Volunteer'} (${a.skill}) → ${a.zoneId?.name || 'Zone'} (${a.distanceKm?.toFixed(2)} km)`
//     ).join('\n')

//     const prompt = `
// You are a senior disaster response commander. Generate a complete situation report.

// ACTIVE DISASTER ZONES:
// ${zonesSummary}

// CURRENT ASSIGNMENTS:
// ${assignSummary || 'No assignments yet'}

// STATISTICS:
// - Total Zones: ${stats?.totalZones || zones.length}
// - Total People Affected: ${zones.reduce((s, z) => s + (z.peopleAffected || 0), 0).toLocaleString()}
// - Available Volunteers: ${stats?.availableVolunteers || 0}

// Respond in EXACT JSON (no markdown, no backticks):
// {
//   "overallStatus": "CRITICAL or HIGH or MODERATE or STABLE",
//   "executiveSummary": "3-4 sentence overall situation summary",
//   "topPriority": "Most critical zone and why",
//   "resourceGaps": ["gap 1", "gap 2", "gap 3"],
//   "immediateRecommendations": ["rec 1", "rec 2", "rec 3", "rec 4"],
//   "coordinationNotes": "Key coordination advice in 2 sentences",
//   "nextSixHours": "What to expect in next 6 hours",
//   "successMetrics": ["metric 1", "metric 2", "metric 3"]
// }
// `
//     const text   = await generateWithRetry(model, prompt)
//     const clean  = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
//     const parsed = JSON.parse(clean)
//     res.json({ success: true, report: parsed, generatedAt: new Date(), source: 'gemini' })

//   } catch (err) {
//     console.log('Gemini unavailable, using smart fallback:', err.message)
//     res.json({
//       success: true,
//       report: getReportFallback(req.body.zones || [], req.body.assignments || []),
//       generatedAt: new Date(),
//       source: 'fallback'
//     })
//   }
// })

// // ── Resource plan ──
// router.post('/resource-plan', async (req, res) => {
//   try {
//     const { zone } = req.body
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

//     const prompt = `
// You are a disaster logistics expert. Provide a resource deployment plan.

// Zone: ${zone.name}
// Severity: ${zone.severity}/10
// People Affected: ${zone.peopleAffected}
// Type: ${zone.requiredSkill}

// Respond in EXACT JSON (no markdown):
// {
//   "food": { "quantity": "X units", "type": "specific items", "priority": "high/medium/low" },
//   "water": { "quantity": "X liters", "priority": "high/medium/low" },
//   "medicine": { "quantity": "X kits", "items": ["item1", "item2"], "priority": "high/medium/low" },
//   "shelter": { "tents": "X units", "blankets": "X units", "priority": "high/medium/low" },
//   "equipment": ["equipment 1", "equipment 2", "equipment 3"],
//   "estimatedCost": "rough estimate in INR",
//   "deploymentTime": "how fast these should reach"
// }
// `
//     const text   = await generateWithRetry(model, prompt)
//     const clean  = text.replace(/\`\`\`json|\`\`\`/g, '').trim()
//     const parsed = JSON.parse(clean)
//     res.json({ success: true, plan: parsed, zoneName: zone.name, source: 'gemini' })

//   } catch (err) {
//     console.log('Gemini unavailable, using fallback')
//     res.json({
//       success: true,
//       plan: {
//         food: { quantity: `${Math.ceil(zone.peopleAffected / 3)} meal packs`, type: 'Ready-to-eat meals', priority: 'high' },
//         water: { quantity: `${zone.peopleAffected * 3} liters`, priority: 'high' },
//         medicine: { quantity: `${Math.ceil(zone.peopleAffected / 10)} kits`, items: ['First aid', 'ORS packets', 'Bandages'], priority: 'high' },
//         shelter: { tents: `${Math.ceil(zone.peopleAffected / 5)}`, blankets: `${zone.peopleAffected}`, priority: 'medium' },
//         equipment: ['Emergency generators', 'Communication radios', 'Search lights'],
//         estimatedCost: `₹${(zone.peopleAffected * 500).toLocaleString()} approx`,
//         deploymentTime: zone.severity >= 8 ? 'Within 2 hours' : 'Within 6 hours'
//       },
//       zoneName: zone.name,
//       source: 'fallback'
//     })
//   }
// })

// module.exports = router
const express = require('express')
const router  = express.Router()

function getZoneFallback(zone) {
  const level = zone.priorityScore >= 7 ? 'CRITICAL' : zone.priorityScore >= 5 ? 'HIGH' : 'MEDIUM'
  return {
    situationSummary: `${zone.name} is a ${level.toLowerCase()} disaster zone with severity ${zone.severity}/10 affecting ${(zone.peopleAffected||0).toLocaleString()} people. Immediate ${zone.requiredSkill} response is required to prevent further casualties and ensure survivor safety.`,
    immediateActions: [
      `Deploy ${zone.requiredSkill} teams to ${zone.name} immediately`,
      `Establish emergency communication center at nearest safe location`,
      `Begin evacuation of most vulnerable populations first`
    ],
    suppliesNeeded: [
      zone.requiredSkill === 'medical' ? 'Medical kits and medicines' : 'Rescue equipment and ropes',
      'Emergency food and water — 3 day supply',
      'Temporary shelter materials and tents'
    ],
    riskLevel: level,
    timeToAct: level === 'CRITICAL' ? 'Immediate — within 30 minutes' : 'Urgent — within 2 hours',
    volunteerAdequacy: `Current volunteer assignment needs review for ${(zone.peopleAffected||0).toLocaleString()} affected people. Additional ${zone.requiredSkill} volunteers strongly recommended.`,
    prediction: `Without immediate intervention at ${zone.name}, the situation could escalate significantly within 6 hours, potentially doubling the number of people at risk.`
  }
}

function getReportFallback(zones, assignments) {
  const totalAffected = (zones||[]).reduce((s, z) => s + (z.peopleAffected || 0), 0)
  const sorted = [...(zones||[])].sort((a, b) => (b.priorityScore||0) - (a.priorityScore||0))
  const topZone = sorted[0] || {}
  const hasCritical = (zones||[]).some(z => (z.priorityScore||0) >= 7)
  return {
    overallStatus: hasCritical ? 'CRITICAL' : 'HIGH',
    executiveSummary: `Active disaster response operation covering ${(zones||[]).length} zones with ${totalAffected.toLocaleString()} total people affected. ${(assignments||[]).length} volunteer assignments are currently active. Immediate coordination required across all zones to minimize casualties.`,
    topPriority: topZone.name ? `${topZone.name} — highest priority score of ${(topZone.priorityScore||0).toFixed(2)} with ${(topZone.peopleAffected||0).toLocaleString()} people affected` : 'No zones available',
    resourceGaps: [
      'Additional medical volunteers needed for high-severity zones',
      'Food and water supplies need replenishment in flood areas',
      'Communication infrastructure needs reinforcement in remote zones'
    ],
    immediateRecommendations: [
      'Prioritize rescue operations in zones with severity 8 and above',
      'Coordinate with local NGOs for additional volunteer support',
      'Set up emergency supply distribution centers at safe locations',
      'Establish real-time communication between all zone commanders'
    ],
    coordinationNotes: `All ${(zones||[]).length} zone commanders should maintain hourly check-ins with headquarters. Resource sharing between nearby zones is recommended to optimize response efficiency.`,
    nextSixHours: `Expect situation to remain ${hasCritical ? 'critical' : 'serious'} for the next 6 hours. Weather conditions may affect rescue operations. Maintain reserve volunteer capacity of at least 20% for emergency response.`,
    successMetrics: [
      'All critical zones have assigned volunteers within 1 hour',
      'All affected people reached within 4 hours',
      'Zero volunteer idle time in active disaster zones'
    ]
  }
}

// Try Gemini, always fallback on any error
async function tryGemini(prompt, apiKey) {
  if (!apiKey) throw new Error('No API key')
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  // Wait 2 seconds to avoid rate limits
  await new Promise(r => setTimeout(r, 2000))
  
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim().replace(/```json|```/g, '').trim()
  return JSON.parse(text)
}

router.post('/zone-insight', async (req, res) => {
  const { zone } = req.body
  try {
    const parsed = await tryGemini(`
You are a disaster response expert. Analyze this zone and respond ONLY in raw JSON with no markdown:
Zone: ${zone.name}, Severity: ${zone.severity}/10, People: ${zone.peopleAffected}, Skill: ${zone.requiredSkill}, Priority: ${(zone.priorityScore||0).toFixed(2)}
JSON format: {"situationSummary":"...","immediateActions":["...","...","..."],"suppliesNeeded":["...","...","..."],"riskLevel":"CRITICAL or HIGH or MEDIUM or LOW","timeToAct":"...","volunteerAdequacy":"...","prediction":"..."}
`, process.env.GEMINI_API_KEY)
    res.json({ success: true, insight: parsed, source: 'gemini' })
  } catch (err) {
    console.log('Gemini failed, using fallback:', err.message)
    res.json({ success: true, insight: getZoneFallback(zone), source: 'fallback' })
  }
})

router.post('/situation-report', async (req, res) => {
  const { zones, volunteers, assignments } = req.body
  try {
    const zSummary = (zones||[]).map(z => `${z.name}: sev ${z.severity}/10, ${z.peopleAffected} affected`).join('; ')
    const parsed = await tryGemini(`
You are a disaster commander. Analyze this situation and respond ONLY in raw JSON with no markdown:
Zones: ${zSummary}
Assignments: ${(assignments||[]).length} active
JSON format: {"overallStatus":"CRITICAL or HIGH or MODERATE or STABLE","executiveSummary":"...","topPriority":"...","resourceGaps":["...","...","..."],"immediateRecommendations":["...","...","...","..."],"coordinationNotes":"...","nextSixHours":"...","successMetrics":["...","...","..."]}
`, process.env.GEMINI_API_KEY)
    res.json({ success: true, report: parsed, generatedAt: new Date(), source: 'gemini' })
  } catch (err) {
    console.log('Gemini failed, using fallback:', err.message)
    res.json({ success: true, report: getReportFallback(zones, assignments), generatedAt: new Date(), source: 'fallback' })
  }
})

router.post('/resource-plan', async (req, res) => {
  const { zone } = req.body
  res.json({
    success: true,
    plan: {
      food:      { quantity: `${Math.ceil((zone.peopleAffected||100)/3)} meal packs`, type: 'Ready-to-eat meals', priority: 'high' },
      water:     { quantity: `${(zone.peopleAffected||100) * 3} liters`, priority: 'high' },
      medicine:  { quantity: `${Math.ceil((zone.peopleAffected||100)/10)} kits`, items: ['First aid', 'ORS packets', 'Bandages'], priority: 'high' },
      shelter:   { tents: `${Math.ceil((zone.peopleAffected||100)/5)}`, blankets: `${zone.peopleAffected||100}`, priority: 'medium' },
      equipment: ['Emergency generators', 'Communication radios', 'Search lights'],
      estimatedCost: `₹${((zone.peopleAffected||100) * 500).toLocaleString()} approx`,
      deploymentTime: (zone.severity||5) >= 8 ? 'Within 2 hours' : 'Within 6 hours'
    },
    zoneName: zone.name,
    source: 'calculated'
  })
})

module.exports = router